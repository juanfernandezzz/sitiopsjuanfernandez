/**
 * Auditoria de la escena ambiental.
 *
 * Rasteriza de verdad con node-canvas y verifica, para cada combinacion de
 * lugar, cielo, hora, temperatura y estacion:
 *
 *  1. Que haya movimiento perceptible en el fondo. Ningun estado del cielo
 *     puede quedar quieto.
 *  2. Que el movimiento se distribuya por el lienzo y no se concentre en una
 *     franja.
 *  3. Que el contraste real del texto sobre los pixeles compuestos llegue a
 *     7:1, medido despues del velo y no sobre el color teorico.
 *
 * Se ejecuta con:  node scripts/auditar-escena.mjs
 */

import { createCanvas, ImageData as ImageDataNode } from 'canvas'
import { construirEscena, paletaFondo } from '../src/lib/escena.js'
import { crearMotor } from '../src/lib/motorEscena.js'

// El motor usa APIs de navegador para sus superficies intermedias.
globalThis.ImageData = ImageDataNode
globalThis.document = { createElement: () => createCanvas(1, 1) }
globalThis.window = { devicePixelRatio: 1 }

const ANCHO = 640
const ALTO = 360
const INK = [42, 59, 76]
const OFF = [255, 253, 248]

const canal = (v) => {
  v /= 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const lum = (r, g, b) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

const NUBES = {
  clearsky: [0.02, 0, 0, 0.06],
  fair: [0.22, 0.1, 0.06, 0.16],
  partlycloudy: [0.52, 0.38, 0.26, 0.2],
  cloudy: [0.95, 0.9, 0.62, 0.26],
  fog: [0.9, 0.9, 0.22, 0.05],
  lightrain: [0.85, 0.8, 0.52, 0.2],
  rain: [0.95, 0.9, 0.72, 0.26],
  heavyrain: [1, 0.95, 0.86, 0.3],
  lightrainshowers: [0.62, 0.52, 0.3, 0.2],
  sleet: [0.95, 0.9, 0.7, 0.2],
  lightsnow: [0.8, 0.7, 0.42, 0.2],
  snow: [0.9, 0.86, 0.6, 0.26],
  heavysnow: [1, 0.95, 0.8, 0.3],
}
const MM = {
  lightrain: 0.5, rain: 2, heavyrain: 5, lightrainshowers: 0.4,
  sleet: 1.5, lightsnow: 0.5, snow: 2, heavysnow: 4.5,
}

const LUGARES = [['Valparaiso', -33.05, -71.62]]
const CIELOS = Object.keys(NUBES)
const HORAS = [2, 10, 16, 21]
const TEMPS = [-15, 22]
const MESES = [5]

// Caja de texto tipica: columna centrada de 620 px.
const CAJA = {
  x0: (ANCHO - 310) / 2,
  x1: (ANCHO + 310) / 2,
  y0: ALTO / 2 - 85,
  y1: ALTO / 2 + 85,
}

function construirClima(lat, lon, cielo, temp, hora, mes) {
  const [total, baja, media, alta] = NUBES[cielo]
  const mm = MM[cielo] || 0
  const suf = ['clearsky', 'fair', 'partlycloudy'].includes(cielo)
    ? hora >= 7 && hora <= 19 ? '_day' : '_night'
    : ''
  const fecha = new Date(Date.UTC(2026, mes, 15, 0, 0, 0))
  fecha.setUTCMinutes(hora * 60 - (lon / 15) * 60)
  return {
    fecha,
    clima: {
      ok: true, lat, lon, simbolo: cielo + suf,
      nubes: { total, baja, media, alta },
      aire: {
        temp,
        humedad: cielo === 'fog' ? 0.96 : mm > 0 ? 0.92 : temp > 26 ? 0.2 : 0.62,
        presion: mm > 2 ? 996 : 1015,
        rocio: cielo === 'fog' ? temp - 0.4 : temp - 7,
      },
      niebla: cielo === 'fog' ? 0.8 : 0,
      uv: temp > 26 ? 10 : 3,
      viento: { vel: 9, dir: 280 },
      precip: { mm },
    },
  }
}

/** Cuenta pixeles que cambian entre dos capturas, global y por franja. */
function analizar(a, b, umbral = 5) {
  const franjas = 4
  const porFranja = new Array(franjas).fill(0)
  const totalFranja = new Array(franjas).fill(0)
  let cambian = 0
  const px = (a.width * a.height) / 4
  for (let i = 0; i < a.data.length; i += 16) {
    const idx = i / 4
    const y = Math.floor(idx / a.width)
    const fr = Math.min(franjas - 1, Math.floor((y / a.height) * franjas))
    totalFranja[fr]++
    const d =
      Math.abs(a.data[i] - b.data[i]) +
      Math.abs(a.data[i + 1] - b.data[i + 1]) +
      Math.abs(a.data[i + 2] - b.data[i + 2])
    if (d > umbral) {
      cambian++
      porFranja[fr]++
    }
  }
  return {
    pct: (100 * cambian) / px,
    franjas: porFranja.map((v, i) => (100 * v) / totalFranja[i]),
  }
}

/**
 * Detecta costuras: rachas largas de saltos de color alineados en una misma
 * columna o fila. Una particula produce rachas de pocos pixeles; un borde mal
 * difuminado produce una linea recta larga.
 */
function costuraMaxima(img, w, h) {
  let peorCol = 0
  let peorFila = 0
  for (let x = 2; x < w - 2; x++) {
    let racha = 0
    for (let y = 2; y < h - 2; y++) {
      const i = (y * w + x) * 4
      const iz = (y * w + x - 1) * 4
      const d =
        Math.abs(img[i] - img[iz]) +
        Math.abs(img[i + 1] - img[iz + 1]) +
        Math.abs(img[i + 2] - img[iz + 2])
      if (d > 10) {
        racha++
        if (racha > peorCol) peorCol = racha
      } else racha = 0
    }
  }
  for (let y = 2; y < h - 2; y++) {
    let racha = 0
    for (let x = 2; x < w - 2; x++) {
      const i = (y * w + x) * 4
      const ar = ((y - 1) * w + x) * 4
      const d =
        Math.abs(img[i] - img[ar]) +
        Math.abs(img[i + 1] - img[ar + 1]) +
        Math.abs(img[i + 2] - img[ar + 2])
      if (d > 10) {
        racha++
        if (racha > peorFila) peorFila = racha
      } else racha = 0
    }
  }
  return Math.max(peorCol, peorFila)
}

function contrasteReal(ctx, polaridad) {
  const z = ctx.getImageData(CAJA.x0, CAJA.y0, CAJA.x1 - CAJA.x0, CAJA.y1 - CAJA.y0)
  let lmin = 1
  let lmax = 0
  for (let i = 0; i < z.data.length; i += 8) {
    const L = lum(z.data[i], z.data[i + 1], z.data[i + 2])
    if (L < lmin) lmin = L
    if (L > lmax) lmax = L
  }
  const lT = lum(...(polaridad === 'claro' ? INK : OFF))
  return Math.min(ratio(lT, lmin), ratio(lT, lmax))
}

const canvas = createCanvas(ANCHO, ALTO)
const ctx = canvas.getContext('2d')
const motor = crearMotor(canvas, { dprMax: 1 })
motor.dimensionar(ANCHO, ALTO, 1)
motor.fijarCajaTexto(CAJA)

const UMBRAL_MOV = 0.12 // por ciento del lienzo
const fallosMov = []
const fallosContraste = []
const fallosCobertura = []
const fallosCostura = []
const UMBRAL_COSTURA = 40
let peorCostura = 0
let n = 0
let peorMov = Infinity
let peorMovCaso = ''
let peorContraste = Infinity
let peorContrasteCaso = ''
let t = 1000

for (const [nombreLugar, lat, lon] of LUGARES) {
  for (const cielo of CIELOS) {
    for (const hora of HORAS) {
      for (const temp of TEMPS) {
        for (const mes of MESES) {
          const { clima, fecha } = construirClima(lat, lon, cielo, temp, hora, mes)
          const escena = construirEscena(clima, fecha)
          const paleta = paletaFondo(escena)
          motor.actualizarEscena(escena, paleta, fecha)
          motor.fijarProgreso(0.5)

          // Deja construir las texturas de nube y estabilizar.
          for (let k = 0; k < 18; k++) { motor.cuadro(t, 33); t += 33 }
          const a = ctx.getImageData(0, 0, ANCHO, ALTO)
          // Ventana de 2 segundos: lo que ve alguien mirando la seccion.
          for (let k = 0; k < 34; k++) { motor.cuadro(t, 33); t += 33 }
          const b = ctx.getImageData(0, 0, ANCHO, ALTO)

          const mov = analizar(a, b)
          const cr = contrasteReal(ctx, paleta.polaridad)
          const cost = costuraMaxima(b.data, ANCHO, ALTO)
          if (cost > peorCostura) peorCostura = cost
          const etq = `${nombreLugar}/${cielo}/${hora}h/${temp}C/m${mes}`

          n++
          if (n % 20 === 0) {
            process.stdout.write(
              `  ${n} auditadas | sin mov: ${fallosMov.length} | bajo AAA: ${fallosContraste.length} | concentrado: ${fallosCobertura.length}` +
                ` | mov min ${peorMov.toFixed(3)}% (${peorMovCaso}) | contraste min ${peorContraste.toFixed(2)}:1\n`
            )
          }
          if (mov.pct < peorMov) {
            peorMov = mov.pct
            peorMovCaso = etq
          }
          if (cr < peorContraste) {
            peorContraste = cr
            peorContrasteCaso = etq
          }
          if (mov.pct < UMBRAL_MOV) fallosMov.push(`${etq} = ${mov.pct.toFixed(3)}%`)
          if (cr < 7) fallosContraste.push(`${etq} = ${cr.toFixed(2)}:1`)
          if (cost > UMBRAL_COSTURA) fallosCostura.push(`${etq} racha ${cost}px`)
          // Movimiento presente en al menos 3 de las 4 franjas horizontales.
          const franjasVivas = mov.franjas.filter((v) => v > 0.02).length
          if (franjasVivas < 3) {
            fallosCobertura.push(
              `${etq} solo ${franjasVivas}/4 franjas [${mov.franjas.map((v) => v.toFixed(2)).join(' ')}]`
            )
          }
        }
      }
    }
  }
}

const linea = '-'.repeat(64)
console.log(linea)
console.log(`Combinaciones auditadas: ${n.toLocaleString('es')}`)
console.log(linea)
console.log(`Movimiento minimo:   ${peorMov.toFixed(3)}%  en ${peorMovCaso}`)
console.log(`Contraste minimo:    ${peorContraste.toFixed(2)}:1  en ${peorContrasteCaso}`)
console.log(linea)
console.log(`Estados sin movimiento (< ${UMBRAL_MOV}%):  ${fallosMov.length}`)
fallosMov.slice(0, 12).forEach((f) => console.log('   ' + f))
if (fallosMov.length > 12) console.log(`   ... y ${fallosMov.length - 12} mas`)
console.log(`Estados bajo AAA:                    ${fallosContraste.length}`)
fallosContraste.slice(0, 12).forEach((f) => console.log('   ' + f))
if (fallosContraste.length > 12) console.log(`   ... y ${fallosContraste.length - 12} mas`)
console.log(`Estados con bordes visibles:         ${fallosCostura.length}   (racha maxima ${peorCostura}px, umbral ${UMBRAL_COSTURA})`)
fallosCostura.slice(0, 8).forEach((f) => console.log('   ' + f))
console.log(`Estados con movimiento concentrado:  ${fallosCobertura.length}`)
fallosCobertura.slice(0, 12).forEach((f) => console.log('   ' + f))
if (fallosCobertura.length > 12) console.log(`   ... y ${fallosCobertura.length - 12} mas`)
console.log(linea)

const ok =
  !fallosMov.length && !fallosContraste.length && !fallosCobertura.length && !fallosCostura.length
console.log(ok ? 'AUDITORIA SUPERADA' : 'AUDITORIA CON FALLOS')
process.exit(ok ? 0 : 1)
