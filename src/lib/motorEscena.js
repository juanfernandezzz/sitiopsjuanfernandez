import { renderCielo, turbidezDe } from './cielo.js'
import { fbmDeformado, crearCampoCurl } from './ruido.js'
import { estrellasVisibles, trazosVisibles } from './estrellas.js'

/**
 * Motor de render de la escena ambiental.
 *
 * Separado del componente de React para poder probarlo, medirlo y sustituirlo
 * sin tocar el arbol de la interfaz.
 *
 * Composicion, de atras hacia adelante:
 *   1. Cielo analitico de Perez, con aureola solar y turbidez derivada de
 *      datos reales. Se rinde a malla gruesa y se escala.
 *   2. Estrellas en su posicion verdadera, solo de noche.
 *   3. Tres capas de nube generadas con FBM deformado, tileables en X y
 *      desplazadas segun el viento real. Parallax entre capas.
 *   4. Precipitacion y aire, con las particulas advectadas por un campo
 *      curl de divergencia cero.
 *   5. Mascara de legibilidad: velo opaco solo sobre la caja de texto.
 *
 * La mascara es la pieza que permite que la animacion corra a intensidad
 * plena. Antes se atenuaba todo el lienzo para proteger la lectura, lo que
 * apagaba la escena entera para resolver un problema que solo existe en la
 * columna de texto.
 */

const TAU = Math.PI * 2
const CIELO_W = 72
const CIELO_H = 44
const NUBE_W = 112
const NUBE_H = 64
const FILAS_POR_TANDA = 8
// Brillo relativo de las particulas por detras del texto.
const ATENUA_TEXTO = 0.1

const leerRgb = (s) => {
  const m = s.match(/[\d.]+/g)
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}

export function crearMotor(canvas, opciones = {}) {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return null

  const dprMax = opciones.dprMax || 1.5
  let dpr = Math.min(window.devicePixelRatio || 1, dprMax)
  let ancho = 1
  let alto = 1

  let escena = null
  let paleta = null
  let progreso = 0

  // Superficies intermedias
  const cieloCv = document.createElement('canvas')
  cieloCv.width = CIELO_W
  cieloCv.height = CIELO_H
  const cieloCtx = cieloCv.getContext('2d', { willReadFrequently: true })

  const capasNube = [0, 1, 2].map(() => {
    const c = document.createElement('canvas')
    c.width = NUBE_W
    c.height = NUBE_H
    return { cv: c, ctx: c.getContext('2d'), img: null, listo: false, fila: 0, semilla: 0 }
  })

  let gotas = []
  let copos = []
  let cristales = []
  let motas = []
  let estrellas = []
  let trazos = []
  let brisa = []
  let tallos = []
  let aves = []
  let fugaz = null
  let proximaFugaz = 9000

  // Lista de cajas de texto. En una columna estrecha el rectangulo que
  // envuelve TODO el texto ocupa casi la seccion entera, asi que el velo
  // tapaba el 95 por ciento del lienzo. Midiendo cada bloque por separado,
  // los huecos entre parrafos, titulo y tarjetas quedan libres.
  let cajasTexto = []
  let velo = null
  const campo = crearCampoCurl(26, 18, 1600)

  // Superficie propia del velo. Se recalcula solo al cambiar tamano, caja de
  // texto o paleta, no por cuadro.
  const veloCv = document.createElement('canvas')
  const veloCtx = veloCv.getContext('2d')
  const capaCv = document.createElement('canvas')
  const capaCtx = capaCv.getContext('2d')
  let nubes = []
  /* ---------------- cielo ---------------- */

  function rendirCielo() {
    if (!escena || !paleta) return
    cieloCtx.putImageData(renderCielo(escena, paleta, CIELO_W, CIELO_H), 0, 0)
  }

  /* ---------------- nubes ---------------- */

  /**
   * Genera la textura de una capa por tandas de filas para no bloquear.
   * El ruido se muestrea con periodo entero en X, asi que la textura
   * puede repetirse en horizontal sin costura.
   */
  function avanzarNube(capa, indice) {
    if (capa.listo || !escena) return
    const conf = escena.capas[indice]
    if (!capa.img) capa.img = capa.ctx.createImageData(NUBE_W, NUBE_H)
    const d = capa.img.data

    const escala = 2.4 / conf.escala
    const cobertura = conf.cobertura
    // Umbral: mas cobertura significa umbral mas bajo y nubes mas anchas.
    const umbral = 0.62 - cobertura * 0.72
    const suavidad = 0.26 + (1 - cobertura) * 0.16

    const tinteNube = leerRgb(paleta.nubeBase)
    const tinteCima = leerRgb(paleta.nubeCima)

    const desde = capa.fila
    const hasta = Math.min(NUBE_H, desde + FILAS_POR_TANDA)

    for (let j = desde; j < hasta; j++) {
      // La densidad decae hacia el borde superior e inferior de la capa.
      const v = j / (NUBE_H - 1)
      const perfil = Math.sin(Math.pow(v, 0.85) * Math.PI)
      for (let i = 0; i < NUBE_W; i++) {
        const u = i / NUBE_W
        // Muestreo cilindrico: garantiza continuidad al repetir en X.
        const ang = u * TAU
        const nx = Math.cos(ang) * escala * 2 + capa.semilla
        const ny = Math.sin(ang) * escala * 2
        const n = fbmDeformado(nx + j * 0.011, ny + v * escala * 3.2, capa.semilla)

        const bruto = (n + 1) * 0.5
        let a = (bruto - umbral) / suavidad
        a = a < 0 ? 0 : a > 1 ? 1 : a
        a = a * a * (3 - 2 * a) * perfil * conf.opacidad

        // El color se escribe en la propia textura. Tintar al componer
        // exigiria una superficie extra por capa y por cuadro.
        const p = (j * NUBE_W + i) * 4
        // Las cimas iluminadas y las bases en sombra: el gradiente vertical
        // dentro de la nube es lo que le da volumen.
        const luzInterna = 1 - v * 0.55
        d[p] = Math.round(tinteNube[0] + (tinteCima[0] - tinteNube[0]) * luzInterna)
        d[p + 1] = Math.round(tinteNube[1] + (tinteCima[1] - tinteNube[1]) * luzInterna)
        d[p + 2] = Math.round(tinteNube[2] + (tinteCima[2] - tinteNube[2]) * luzInterna)
        d[p + 3] = Math.round(a * 255)
      }
    }
    capa.fila = hasta
    if (hasta >= NUBE_H) {
      capa.ctx.putImageData(capa.img, 0, 0)
      capa.listo = true
    }
  }

  function reiniciarNubes(nuevaSemilla) {
    capasNube.forEach((c, i) => {
      c.listo = false
      c.fila = 0
      if (nuevaSemilla) c.semilla = i * 31.7 + Math.random() * 100
    })
  }

  /* ---------------- particulas ---------------- */

  function sembrar() {
    if (!escena) return
    // Techo por AREA del lienzo, no por ancho. Escalar por ancho daba 490
    // particulas en 1351x420 y solo 174 en 390x1500, con la misma area:
    // tres veces menos densidad en vertical.
    const base = Math.min((ancho * alto) / 1500, 520)
    const n = Math.round(base * escena.precip.intensidad)
    gotas = []
    copos = []
    const esNieve = escena.precip.tipo === 'nieve'
    const esMixto = escena.precip.tipo === 'aguanieve'
    for (let i = 0; i < n; i++) {
      const p = {
        x: Math.random() * ancho,
        y: Math.random() * alto,
        v: 0.4 + Math.random() * 0.75,
        r: Math.random() * TAU,
        e: 0.45 + Math.random() * 0.8,
        vx: 0,
        vy: 0,
      }
      if (esNieve || (esMixto && i % 2 === 0)) copos.push(p)
      else gotas.push(p)
    }

    // Medido en navegador: con los tamanos anteriores el polvo de diamante
    // y el polvo en suspension movian el 0.1 por ciento del area, contra el
    // 2 por ciento de la lluvia. Eran correctos en el modelo e invisibles en
    // pantalla. Se sube cantidad y calibre.
    cristales = []
    const nc = Math.round(Math.min((ancho * alto) / 2400, 400) * escena.aire.escarcha)
    for (let i = 0; i < nc; i++) {
      cristales.push({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        v: 0.1 + Math.random() * 0.4,
        f: Math.random() * TAU,
        w: 0.9 + Math.random() * 2.1,
        t: 0.4 + Math.random() * 1.3,
      })
    }

    /**
     * Brisa: canal de movimiento SIEMPRE presente.
     *
     * Es la garantia estructural de que ningun estado del cielo quede
     * quieto. Su densidad es inversa a la de los demas canales, asi que
     * en un dia de lluvia casi no aparece y en un cielo despejado lleva
     * ella sola el movimiento del aire. Muy tenue por diseno: se percibe
     * como que el aire se mueve, no como particulas.
     */
    brisa = []
    const ocupacion = Math.min(
      1,
      escena.precip.intensidad + escena.aire.escarcha + escena.aire.polvo + escena.niebla
    )
    const nb = Math.round(Math.min((ancho * alto) / 2900, 300) * (1 - ocupacion * 0.8))
    for (let i = 0; i < nb; i++) {
      brisa.push({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        f: Math.random() * TAU,
        r: 1 + Math.random() * 2.4,
        v: 0.25 + Math.random() * 0.75,
        a: 0.14 + Math.random() * 0.22,
      })
    }

    /**
     * Banda vegetal del borde inferior.
     *
     * Siluetas abstractas que se doblan con el viento real. NO son una
     * especie reconocible ni una silueta geografica: eso revelaria la
     * ubicacion inferida, que es justamente lo que la escena evita.
     *
     * Cumple dos funciones. Ancla la composicion en el borde inferior, que
     * de otro modo queda vacio, y aporta movimiento permanente en la franja
     * baja del lienzo: sin ella, la escena nocturna en pantalla estrecha
     * concentraba todo el movimiento en la mitad superior.
     */
    tallos = []
    const nt = Math.round(Math.min(ancho / 9, 46))
    for (let i = 0; i < nt; i++) {
      tallos.push({
        x: (i + 0.5) / nt + (Math.random() - 0.5) * 0.5 / nt,
        h: 0.045 + Math.random() * 0.075,
        f: Math.random() * TAU,
        v: 0.7 + Math.random() * 0.7,
        curva: (Math.random() - 0.5) * 0.5,
        grosor: 0.7 + Math.random() * 1.2,
      })
    }

    /**
     * Aves. Solo con cielo mayormente abierto y de dia, que es cuando se
     * ven de verdad. Cruzan en bandada, con aleteo desfasado entre ellas.
     */
    aves = []
    const cieloAbierto = 1 - Math.min(1, escena.nubeTotal * 1.3 + escena.niebla * 1.6)
    const hayLuz = escena.luz > 0.12
    const puedeVolar = escena.precip.intensidad < 0.35 && cieloAbierto > 0.25 && hayLuz
    if (puedeVolar) {
      const cuantas = 3 + Math.round(Math.random() * 4 + cieloAbierto * 3)
      const baseX = -0.15 - Math.random() * 0.3
      const baseY = 0.14 + Math.random() * 0.3
      for (let i = 0; i < cuantas; i++) {
        aves.push({
          // Formacion en V suelta.
          ox: baseX - i * (0.022 + Math.random() * 0.02),
          oy: baseY + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (0.016 + Math.random() * 0.014),
          f: Math.random() * TAU,
          vel: 0.7 + Math.random() * 0.35,
          esc: 0.8 + Math.random() * 0.5,
        })
      }
    }

    motas = []
    const nm = Math.round(Math.min((ancho * alto) / 4200, 230) * escena.aire.polvo)
    for (let i = 0; i < nm; i++) {
      motas.push({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        f: Math.random() * TAU,
        r: 1.4 + Math.random() * 4.4,
        v: 0.2 + Math.random() * 0.5,
      })
    }
  }

  function recalcularEstrellas(fecha) {
    if (!escena || paleta.polaridad !== 'oscuro') {
      estrellas = []
      trazos = []
      return
    }
    // Con luna alta y cielo cubierto se ven menos estrellas, igual que afuera.
    const limite = 2.9 - escena.luna * 1.1 - escena.nubeTotal * 1.4 - escena.niebla * 1.6
    estrellas = estrellasVisibles(fecha, escena.lat, escena.lon, Math.max(0.2, limite))
    trazos = trazosVisibles(estrellas)
  }

  /* ---------------- mascara de legibilidad ---------------- */

  /**
   * Atenuacion de una particula segun su distancia a la caja de texto.
   *
   * Bajar el brillo de lo que pasa por detras del texto es preferible a
   * subir la opacidad del velo: el velo afecta todo el lienzo, esto solo la
   * columna de lectura. Con esto el pico de luminancia dentro de la caja
   * baja lo suficiente para sostener 7:1 con un velo mucho mas ligero, y
   * fuera de la caja la escena conserva toda su amplitud.
   */
  function factorTexto(x, y) {
    if (!cajasTexto.length) return 1
    const d = Math.max(48, Math.min(140, alto * 0.18))
    let mejor = Infinity
    for (const c of cajasTexto) {
      const dx = x < c.x0 ? c.x0 - x : x > c.x1 ? x - c.x1 : 0
      const dy = y < c.y0 ? c.y0 - y : y > c.y1 ? y - c.y1 : 0
      if (dx === 0 && dy === 0) return ATENUA_TEXTO
      const h = Math.hypot(dx, dy)
      if (h < mejor) mejor = h
    }
    const k = Math.min(1, mejor / d)
    return ATENUA_TEXTO + (1 - ATENUA_TEXTO) * (k * k * (3 - 2 * k))
  }

  /**
   * Velo de legibilidad.
   *
   * Se compone como el PRODUCTO de un perfil horizontal y uno vertical,
   * no como un rectangulo con bandas y esquinas cosidas. Coser por partes
   * dejaba costuras visibles: en el borde de una banda lateral el valor
   * seguia siendo opaco mientras la radial de la esquina ya decaia, y el
   * salto se veia como un marco rectangular sobre la escena.
   *
   * El producto se obtiene pintando el perfil horizontal sobre toda la
   * superficie y aplicando despues el vertical con destination-in, que
   * multiplica los canales alfa. El resultado es continuo en todo el plano
   * por construccion, sin uniones que ajustar.
   *
   * Se cachea porque solo depende del tamano, la caja y la paleta.
   */
  function construirVelo() {
    if (!paleta || !cajasTexto.length || ancho < 2 || alto < 2) {
      velo = null
      return
    }
    const rgb = paleta.cenit.match(/[\d.]+/g).slice(0, 3).join(',')
    const cuerpo = typeof paleta.opacidadVelo === 'number' ? paleta.opacidadVelo : 0.88

    veloCv.width = ancho
    veloCv.height = alto
    veloCtx.clearRect(0, 0, ancho, alto)

    // El difuminado se acota tambien por el ancho: en una columna estrecha
    // un difuminado calibrado para escritorio desborda a ambos lados y deja
    // el lienzo entero bajo el velo.
    // En una columna estrecha el texto ocupa casi todo el ancho, asi que el
    // unico respiro son los huecos entre bloques. Un difuminado calibrado
    // para escritorio los sella: medido, la escena nocturna en 390x1500
    // caia a 0.04 por ciento de movimiento. Se acota por el hueco tipico.
    const estrecho = ancho < 620
    const m = Math.min(estrecho ? 12 : 22, alto * 0.03, ancho * 0.05)
    const d = Math.min(estrecho ? 30 : 88, alto * 0.09, ancho * 0.14)

    const opaco = `rgba(${rgb}, ${cuerpo})`
    const nada = `rgba(${rgb}, 0)`

    // Una pasada por bloque de texto. Cada pasada es el producto de un
    // perfil horizontal y uno vertical, continuo por construccion. Al
    // superponerlas con source-over el alfa resultante es
    // 1 - producto de (1 - ai), que sigue siendo suave.
    for (const caja of cajasTexto) {
      const x0 = caja.x0 - m
      const x1 = caja.x1 + m
      const y0 = caja.y0 - m
      const y1 = caja.y1 + m
      if (x1 - x0 < 4 || y1 - y0 < 4) continue

      capaCv.width = ancho
      capaCv.height = alto
      capaCtx.clearRect(0, 0, ancho, alto)

      const gh = capaCtx.createLinearGradient(0, 0, ancho, 0)
      const px = (v) => Math.max(0, Math.min(1, v / ancho))
      gh.addColorStop(0, nada)
      gh.addColorStop(px(x0 - d), nada)
      gh.addColorStop(px(x0), opaco)
      gh.addColorStop(px(x1), opaco)
      gh.addColorStop(px(x1 + d), nada)
      gh.addColorStop(1, nada)
      capaCtx.fillStyle = gh
      capaCtx.fillRect(0, 0, ancho, alto)

      capaCtx.globalCompositeOperation = 'destination-in'
      const gv = capaCtx.createLinearGradient(0, 0, 0, alto)
      const py = (v) => Math.max(0, Math.min(1, v / alto))
      gv.addColorStop(0, 'rgba(0,0,0,0)')
      gv.addColorStop(py(y0 - d), 'rgba(0,0,0,0)')
      gv.addColorStop(py(y0), 'rgba(0,0,0,1)')
      gv.addColorStop(py(y1), 'rgba(0,0,0,1)')
      gv.addColorStop(py(y1 + d), 'rgba(0,0,0,0)')
      gv.addColorStop(1, 'rgba(0,0,0,0)')
      capaCtx.fillStyle = gv
      capaCtx.fillRect(0, 0, ancho, alto)
      capaCtx.globalCompositeOperation = 'source-over'

      veloCtx.drawImage(capaCv, 0, 0)
    }

    velo = true
  }

  /* ---------------- dibujo ---------------- */

  function dibujarEstrellas(t) {
    if (!estrellas.length) return
    const atenua = 1 - escena.nubeTotal * 0.55 - escena.niebla * 0.7
    if (atenua <= 0.05) return

    // Banda celeste con proporcion acotada. Proyectar las estrellas
    // estirandolas con el alto deforma las constelaciones y convierte los
    // trazos en rayas: medido, 180 px de linea recta en 375x1560, que el
    // auditor marca como borde y que a la vista parece un rayon.
    const altoCielo = Math.min(alto * 0.86, ancho * 0.85)

    if (trazos.length) {
      ctx.strokeStyle = paleta.trazoColor
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.2 * atenua
      ctx.beginPath()
      for (const [a, b] of trazos) {
        ctx.moveTo(a.x * ancho, a.y * altoCielo)
        ctx.lineTo(b.x * ancho, b.y * altoCielo)
      }
      ctx.stroke()
    }

    ctx.fillStyle = paleta.estrellaColor
    for (const e of estrellas) {
      const x = e.x * ancho
      const y = e.y * altoCielo
      // El centelleo es mas fuerte cerca del horizonte, como en el cielo real.
      const cercaHorizonte = e.y
      const centelleo =
        1 - cercaHorizonte * 0.34 * (0.5 + 0.5 * Math.sin(t / 620 + e.i * 2.4))
      ctx.globalAlpha = Math.min(1, e.brillo * 1.25) * atenua * centelleo * factorTexto(x, y)
      const r = 1 + e.brillo * 2.8
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
      // Las mas brillantes reciben un halo suave.
      if (e.brillo > 0.42) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5)
        g.addColorStop(0, paleta.estrellaColor)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = e.brillo * 0.3 * atenua * factorTexto(x, y)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r * 5, 0, TAU)
        ctx.fill()
        ctx.fillStyle = paleta.estrellaColor
      }
    }
    ctx.globalAlpha = 1
  }

  function dibujarAstro(t) {
    const nocturno = paleta.polaridad === 'oscuro'
    if (escena.astro.altitud < -6) return
    if (nocturno && escena.luna < 0.06) return

    const x = escena.astro.x * ancho
    const y = escena.astro.y * alto * 0.72
    const radio = (nocturno ? 11 + escena.luna * 8 : 17 + escena.luz * 13) * (1 - escena.niebla * 0.3)
    const respiro = 1 + Math.sin(t / 3400) * 0.025
    const alcance = radio * (7 + escena.bruma * 6 + turbidezDe(escena) * 0.5)

    const halo = ctx.createRadialGradient(x, y, radio * 0.3, x, y, alcance)
    halo.addColorStop(0, paleta.haloColor)
    halo.addColorStop(0.45, paleta.haloMedio)
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(x, y, alcance, 0, TAU)
    ctx.fill()

    ctx.fillStyle = paleta.astroColor
    ctx.beginPath()
    ctx.arc(x, y, radio * respiro, 0, TAU)
    ctx.fill()

    if (nocturno && escena.luna < 0.94) {
      // Terminador lunar: la sombra avanza segun la fase real.
      const desfase = radio * 2 * (1 - escena.luna)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x - desfase, y, radio * respiro * 1.02, 0, TAU)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }

    if (escena.aire.haloHielo > 0.02) {
      const rA = radio * 3.7
      ctx.globalAlpha = escena.aire.haloHielo * 0.8
      ctx.strokeStyle = paleta.haloAnillo
      ctx.lineWidth = 1 + escena.aire.haloHielo * 2.4
      ctx.beginPath()
      ctx.arc(x, y, rA, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  function dibujarRayos(t) {
    // Rayos crepusculares: solo con sol bajo y cobertura parcial, que es
    // exactamente cuando ocurren en la realidad.
    const fuerza = escena.calidez * Math.min(1, escena.nubeTotal * 2.2) * (1 - escena.nubeTotal * 0.55)
    if (fuerza < 0.06) return
    const x = escena.astro.x * ancho
    const y = escena.astro.y * alto * 0.72
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 7; i++) {
      const ang = -Math.PI / 2 + (i - 3) * 0.19 + Math.sin(t / 7000 + i) * 0.035
      const largo = alto * (1.5 + (i % 3) * 0.3)
      const abre = 0.045 + (i % 2) * 0.02
      ctx.globalAlpha = fuerza * (0.09 - Math.abs(i - 3) * 0.014)
      ctx.fillStyle = paleta.rayoColor
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(ang - abre) * largo, y - Math.sin(ang - abre) * largo)
      ctx.lineTo(x + Math.cos(ang + abre) * largo, y - Math.sin(ang + abre) * largo)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
    ctx.globalAlpha = 1
  }

  function dibujarNubes(t) {
    const empuje = (0.1 + escena.viento.fuerza * 0.9) * escena.viento.deriva
    for (let i = 0; i < capasNube.length; i++) {
      const capa = capasNube[i]
      if (!capa.listo) continue
      const conf = escena.capas[i]
      if (conf.cobertura < 0.02) continue

      // Parallax: las capas bajas se mueven mas con el viento y con el
      // scroll, las altas casi no. Es lo que da profundidad.
      const velocidad = conf.velocidad * (0.6 + i * 0.5)
      // Medido en navegador: con el divisor anterior el desplazamiento no
      // se leia como movimiento dentro de una sesion de lectura.
      const desplaz = ((t / 1000) * empuje * velocidad * 21) % ancho
      const parallax = progreso * alto * 0.09 * (i + 1) * 0.5

      // Las capas cubren todo el alto del lienzo, no solo la franja
      // superior: es el fondo de la seccion, no una cenefa.
      const escalaY = alto * (0.52 + i * 0.26)
      const topeY = alto * (conf.altura * 0.62 - 0.2) - parallax

      // Se dibuja tres veces para cubrir la costura al desplazar.
      // La textura es tileable en X, asi que no hay corte visible.
      const base = ((desplaz % ancho) + ancho) % ancho
      ctx.globalAlpha = paleta.nubeAlpha * (0.72 + i * 0.14)
      for (let k = -1; k <= 1; k++) {
        ctx.drawImage(capa.cv, base + k * ancho, topeY, ancho, escalaY)
      }
      ctx.globalAlpha = 1
    }
  }

  function dibujarPrecipitacion(t, dt) {
    if (escena.precip.tipo === 'ninguna') return
    const paso = Math.min(dt / 16.7, 3)
    const env = escena.precip.chubasco ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 9000)) : 1
    const incl = escena.viento.deriva * (0.3 + escena.viento.fuerza * 2.2)
    const caida = (0.1 + escena.precip.intensidad * 0.2) * alto
    // La turbulencia crece con el viento real.
    const fuerzaCurl = 0.8 + escena.viento.fuerza * 4.2

    if (gotas.length) {
      ctx.strokeStyle = paleta.particula
      ctx.lineWidth = 1
      const alphaBase = (0.34 + escena.precip.intensidad * 0.42) * env
      // Las gotas sobre el texto van en una pasada aparte y mas tenue.
      const sobreTexto = []
      ctx.globalAlpha = alphaBase
      ctx.beginPath()
      for (const g of gotas) {
        const [cx, cy] = campo.leer(g.x / ancho, g.y / alto)
        g.x += (incl * g.v * 0.9 + cx * fuerzaCurl) * paso
        g.y += (caida * g.v * 0.1 + cy * fuerzaCurl * 0.35) * paso
        if (g.y > alto) {
          g.y = -12
          g.x = Math.random() * ancho
        }
        if (g.x > ancho + 14) g.x = -14
        if (g.x < -14) g.x = ancho + 14
        const largo = (6 + escena.precip.intensidad * 15) * g.e
        const fa = factorTexto(g.x, g.y)
        if (fa < 0.999) {
          sobreTexto.push([g.x, g.y, largo, fa])
          continue
        }
        ctx.moveTo(g.x, g.y)
        ctx.lineTo(g.x + incl * largo * 0.34, g.y + largo)
      }
      ctx.stroke()
      for (const [gx, gy, largo, fa] of sobreTexto) {
        ctx.globalAlpha = alphaBase * fa
        ctx.beginPath()
        ctx.moveTo(gx, gy)
        ctx.lineTo(gx + incl * largo * 0.34, gy + largo)
        ctx.stroke()
      }
    }

    if (copos.length) {
      const alphaCopo = (0.55 + escena.precip.intensidad * 0.32) * env
      ctx.fillStyle = paleta.nieve
      for (const c of copos) {
        const [cx, cy] = campo.leer(c.x / ancho, c.y / alto)
        c.r += 0.005 * paso
        c.x += (Math.sin(c.r) * 0.55 + incl * 0.4 + cx * fuerzaCurl * 1.5) * paso
        c.y += (caida * c.v * 0.03 + cy * fuerzaCurl * 0.5) * paso
        if (c.y > alto) {
          c.y = -10
          c.x = Math.random() * ancho
        }
        if (c.x > ancho + 12) c.x = -12
        if (c.x < -12) c.x = ancho + 12
        ctx.globalAlpha = alphaCopo * factorTexto(c.x, c.y)
        ctx.beginPath()
        ctx.arc(c.x, c.y, 1 + c.e * 1.8, 0, TAU)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  function dibujarAire(t, dt) {
    const paso = Math.min(dt / 16.7, 3)

    if (cristales.length) {
      ctx.fillStyle = paleta.escarchaColor
      for (const c of cristales) {
        const [cx, cy] = campo.leer(c.x / ancho, c.y / alto)
        c.f += 0.03 * paso
        c.x += (cx * 1.5 + Math.sin(c.f * 0.4) * 0.2) * paso
        c.y += (c.v * 0.45 + cy * 1.2) * paso
        if (c.y > alto) {
          c.y = -6
          c.x = Math.random() * ancho
        }
        if (c.x > ancho + 8) c.x = -8
        if (c.x < -8) c.x = ancho + 8
        ctx.globalAlpha =
          (0.3 + 0.7 * Math.abs(Math.sin(c.f * c.t))) *
          (0.5 + escena.aire.escarcha * 0.5) *
          factorTexto(c.x, c.y)
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.w, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    if (motas.length) {
      ctx.fillStyle = paleta.polvoColor
      const alphaMota = 0.42 + escena.aire.polvo * 0.4
      for (const m of motas) {
        const [cx, cy] = campo.leer(m.x / ancho, m.y / alto)
        m.f += 0.01 * paso
        m.x += (m.v * escena.viento.deriva * 0.7 + cx * 2.4) * paso
        m.y += cy * 2.0 * paso
        if (m.x > ancho + 10) m.x = -10
        if (m.x < -10) m.x = ancho + 10
        if (m.y > alto + 10) m.y = -10
        if (m.y < -10) m.y = alto + 10
        ctx.globalAlpha = alphaMota * factorTexto(m.x, m.y)
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    if (brisa.length) {
      ctx.fillStyle = paleta.brisaColor
      for (const b of brisa) {
        const [cx, cy] = campo.leer(b.x / ancho, b.y / alto)
        b.f += 0.008 * paso
        b.x += (cx * 3.6 + escena.viento.deriva * b.v * (0.7 + escena.viento.fuerza * 2.6)) * paso
        b.y += (cy * 2.7 + Math.sin(b.f) * 0.16) * paso
        if (b.x > ancho + 6) b.x = -6
        if (b.x < -6) b.x = ancho + 6
        if (b.y > alto + 6) b.y = -6
        if (b.y < -6) b.y = alto + 6
        ctx.globalAlpha = b.a * (0.55 + 0.45 * Math.sin(b.f * 1.7)) * factorTexto(b.x, b.y)
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    if (escena.aire.ondulacion > 0.03) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 6; i++) {
        const y = alto * (0.56 + i * 0.075)
        const des = Math.sin(t / (900 + i * 260) + i) * ancho * 0.016 * escena.aire.ondulacion
        ctx.globalAlpha = escena.aire.ondulacion * (0.075 - i * 0.011)
        ctx.fillStyle = paleta.haloColor
        ctx.fillRect(des, y, ancho, alto * 0.038)
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  function dibujarAves(t) {
    if (!aves.length) return
    ctx.strokeStyle = paleta.aveColor
    ctx.lineCap = 'round'
    // Una travesia completa cada 70 segundos aproximados.
    const avance = ((t / 70000) % 1.45) - 0.15
    for (const a of aves) {
      const x = (avance + a.ox) * ancho * 1.25
      if (x < -30 || x > ancho + 30) continue
      const y = (a.oy + Math.sin(t / 5200 + a.f) * 0.018) * alto
      const env = 3.4 * a.esc
      // Aleteo: la apertura de las alas oscila.
      const bat = Math.sin(t / 210 * a.vel + a.f)
      const alto2 = env * (0.32 + 0.5 * Math.abs(bat))
      ctx.lineWidth = 1.1 * a.esc
      ctx.globalAlpha = 0.5 * factorTexto(x, y)
      ctx.beginPath()
      ctx.moveTo(x - env, y)
      ctx.quadraticCurveTo(x - env * 0.45, y - alto2, x, y)
      ctx.quadraticCurveTo(x + env * 0.45, y - alto2, x + env, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  function dibujarFugaz(t) {
    if (paleta.polaridad !== 'oscuro') return
    if (escena.nubeTotal > 0.5 || escena.niebla > 0.35) return
    if (!fugaz && t > proximaFugaz) {
      fugaz = {
        x: 0.2 + Math.random() * 0.6,
        y: 0.08 + Math.random() * 0.3,
        ang: 0.5 + Math.random() * 0.7,
        t0: t,
        dur: 900 + Math.random() * 500,
        largo: 0.08 + Math.random() * 0.09,
      }
    }
    if (!fugaz) return
    const k = (t - fugaz.t0) / fugaz.dur
    if (k > 1) {
      fugaz = null
      // Entre 18 y 45 segundos hasta la siguiente.
      proximaFugaz = t + 18000 + Math.random() * 27000
      return
    }
    // El largo se escala por la dimension MENOR del lienzo. Escalarlo por
    // el alto convertia la fugaz en un rayon de 180 px en una seccion alta
    // y estrecha: desproporcionado y detectado como borde por el auditor.
    const escalaFugaz = Math.min(ancho, alto)
    const dx = Math.cos(fugaz.ang) * fugaz.largo * escalaFugaz
    const dy = Math.sin(fugaz.ang) * fugaz.largo * escalaFugaz
    const x = fugaz.x * ancho + dx * k
    const y = fugaz.y * alto + dy * k
    const g = ctx.createLinearGradient(x - dx * 0.28, y - dy * 0.28, x, y)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, paleta.estrellaColor)
    ctx.strokeStyle = g
    ctx.lineWidth = 1.6
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.75
    ctx.beginPath()
    ctx.moveTo(x - dx * 0.28, y - dy * 0.28)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  function dibujarVegetacion(t) {
    if (!tallos.length) return
    // La referencia de altura es la dimension menor: en una seccion muy alta
    // la banda debe seguir siendo una franja, no una selva.
    const ref = Math.min(alto, ancho * 1.6)
    const base = alto + 1
    const empuje = escena.viento.deriva * (0.25 + escena.viento.fuerza * 1.5)

    ctx.strokeStyle = paleta.vegetacionColor
    ctx.lineCap = 'round'
    for (const s of tallos) {
      const x = s.x * ancho
      const largo = s.h * ref
      // El vaiven combina la brisa continua con la fuerza del viento real.
      const vaiven = Math.sin(t / 1900 * s.v + s.f) * (0.06 + escena.viento.fuerza * 0.5)
      const puntaX = x + (empuje * 0.5 + vaiven) * largo
      const puntaY = base - largo
      const ctrlX = x + (s.curva + empuje * 0.2 + vaiven * 0.4) * largo * 0.5
      const ctrlY = base - largo * 0.55

      ctx.lineWidth = s.grosor
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(x, base)
      ctx.quadraticCurveTo(ctrlX, ctrlY, puntaX, puntaY)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  function dibujarNiebla(t) {
    if (escena.niebla < 0.03) return
    for (let i = 0; i < 4; i++) {
      const y = alto * (0.4 + i * 0.16)
      const des = Math.sin(t / (11000 + i * 3100)) * ancho * 0.07
      const g = ctx.createLinearGradient(0, y - alto * 0.14, 0, y + alto * 0.2)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(0.5, paleta.nieblaColor)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = escena.niebla * (0.85 - i * 0.13)
      ctx.fillStyle = g
      ctx.fillRect(des - ancho * 0.12, y - alto * 0.14, ancho * 1.25, alto * 0.34)
    }
    ctx.globalAlpha = 1
  }

  function dibujarVelo() {
    if (!velo) return
    ctx.drawImage(veloCv, 0, 0, ancho, alto)
  }

  /* ---------------- api ---------------- */

  return {
    dimensionar(nuevoAncho, nuevoAlto, nuevaDpr) {
      ancho = Math.max(1, Math.round(nuevoAncho))
      alto = Math.max(1, Math.round(nuevoAlto))
      dpr = Math.min(nuevaDpr || window.devicePixelRatio || 1, dprMax)
      canvas.width = Math.round(ancho * dpr)
      canvas.height = Math.round(alto * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sembrar()
      construirVelo()
    },

    actualizarEscena(nuevaEscena, nuevaPaleta, fecha) {
      // La siembra depende de mas cosas que el tipo de precipitacion.
      // Con la condicion anterior, pasar de dia a noche con el mismo cielo
      // no resembraba y quedaban aves volando de madrugada.
      // La siembra depende tambien de la luz y de los canales de aire: las
      // aves solo vuelan de dia, la brisa cede densidad a los otros canales,
      // la escarcha y el polvo dependen de la temperatura. Mirar solo la
      // precipitacion dejaba aves volando de noche al cambiar la hora.
      const cambioTipo =
        !escena ||
        escena.precip.tipo !== nuevaEscena.precip.tipo ||
        Math.abs(escena.nubeTotal - nuevaEscena.nubeTotal) > 0.08 ||
        Math.abs(escena.precip.intensidad - nuevaEscena.precip.intensidad) > 0.1 ||
        Math.abs(escena.luz - nuevaEscena.luz) > 0.1 ||
        Math.abs(escena.aire.escarcha - nuevaEscena.aire.escarcha) > 0.1 ||
        Math.abs(escena.aire.polvo - nuevaEscena.aire.polvo) > 0.1 ||
        Math.abs(escena.niebla - nuevaEscena.niebla) > 0.1 ||
        Math.abs(escena.precip.intensidad - nuevaEscena.precip.intensidad) > 0.1 ||
        Math.abs(escena.aire.escarcha - nuevaEscena.aire.escarcha) > 0.08 ||
        Math.abs(escena.aire.polvo - nuevaEscena.aire.polvo) > 0.08 ||
        Math.abs(escena.niebla - nuevaEscena.niebla) > 0.08 ||
        (escena.luz > 0.12) !== (nuevaEscena.luz > 0.12)
      escena = nuevaEscena
      paleta = nuevaPaleta
      rendirCielo()
      construirVelo()
      recalcularEstrellas(fecha || new Date())
      if (cambioTipo) {
        reiniciarNubes(true)
        sembrar()
      }
    },

    fijarCajaTexto(caja) {
      cajasTexto = Array.isArray(caja) ? caja.filter(Boolean) : caja ? [caja] : []
      construirVelo()
    },

    fijarProgreso(p) {
      progreso = p
    },

    /** Reduce densidad cuando el dispositivo no sostiene el ritmo. */
    calidad(factor) {
      const recorta = (arr) => arr.slice(0, Math.max(0, Math.round(arr.length * factor)))
      gotas = recorta(gotas)
      copos = recorta(copos)
      cristales = recorta(cristales)
      motas = recorta(motas)
    },

    cuadro(t, dt) {
      if (!escena || !paleta) return
      // La escala espacial de la turbulencia crece con el viento.
      campo.actualizar(t, 2.4 + escena.viento.fuerza * 3.4)
      ctx.clearRect(0, 0, ancho, alto)

      // Cielo
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(cieloCv, 0, 0, CIELO_W, CIELO_H, 0, 0, ancho, alto)

      // Nubes en construccion progresiva
      for (let i = 0; i < capasNube.length; i++) {
        if (!capasNube[i].listo) {
          avanzarNube(capasNube[i], i)
          break
        }
      }

      dibujarEstrellas(t)
      dibujarFugaz(t)
      dibujarAstro(t)
      dibujarRayos(t)
      dibujarNubes(t)
      dibujarPrecipitacion(t, dt)
      dibujarAire(t, dt)
      dibujarAves(t)
      dibujarNiebla(t)
      dibujarVegetacion(t)
      dibujarVelo()
    },

    /** Diagnostico: cuantas particulas y estrellas hay vivas. */
    contarParticulas() {
      return {
        total:
          gotas.length + copos.length + cristales.length + motas.length + brisa.length + aves.length,
        gotas: gotas.length,
        copos: copos.length,
        cristales: cristales.length,
        motas: motas.length,
        nubes: nubes.length,
        estrellas: estrellas.length,
        brisa: brisa.length,
        tallos: tallos.length,
        aves: aves.length,
      }
    },

    destruir() {
      gotas = copos = cristales = motas = estrellas = trazos = brisa = aves = tallos = []
    },
  }
}
