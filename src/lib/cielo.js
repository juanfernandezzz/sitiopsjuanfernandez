import { PALETA } from './escena.js'

/**
 * Cielo analitico.
 *
 * Distribucion de luminancia de Perez con los coeficientes analiticos de
 * Preetham, Shirley y Smits (SIGGRAPH 1999):
 *
 *   F(theta, gamma) = (1 + A e^(B / cos theta)) (1 + C e^(D gamma) + E cos^2 gamma)
 *
 * theta es el angulo cenital de la direccion de vista y gamma el angulo
 * entre esa direccion y el sol.
 *
 * Lo que aporta sobre un gradiente lineal de dos paradas:
 *  - Aureola: el halo real alrededor del sol, mas ancho cuanto mas turbia
 *    la atmosfera. Es el termino C y D.
 *  - Oscurecimiento del cenit y brillo del horizonte, con la forma correcta
 *    y no una interpolacion recta. Es el termino A y B.
 *  - Retrodispersion en el punto opuesto al sol. Es el termino E.
 *
 * La turbidez no se inventa: se deriva de la humedad relativa, el polvo en
 * suspension y la niebla, todos datos reales de la escena.
 *
 * Preetham fue elegido sobre Hosek y Wilkie por costo: Hosek y Wilkie mejora
 * los ocasos y las turbideces altas pero exige tablas de coeficientes que
 * pesarian mas que todo este modulo. Para una escena estilizada que ademas
 * remapea a una paleta fija, la ganancia no justifica el peso.
 */

const acotar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))

// Limites de luminancia relativa que sostienen 7:1 contra los dos colores
// de texto del sistema. Los mismos que usa paletaFondo.
const LUM_CLARO_MIN = 0.66
const LUM_OSCURO_MAX = 0.075

const canalLineal = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const luminanciaDe = (r, g, b) =>
  0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b)

/**
 * Acota la luminancia de un color al rango seguro conservando su tinte.
 *
 * El modelo de Perez aporta la FORMA del cielo: aureola solar, oscurecimiento
 * del cenit, retrodispersion. Pero su rango de luminancia sale del margen que
 * el texto necesita. Medido: el cielo por si solo, sin una sola particula
 * encima, daba entre 4.86 y 6.85 de contraste.
 *
 * Compensarlo con el velo obligaba a taparlo casi por completo. Es mejor
 * remapear la luminancia aqui y dejar el velo solo para las particulas: se
 * conserva toda la estructura visual y se libera el resto del lienzo.
 */
function acotarLuminancia(c, destino, claro) {
  const cumple = (x) => (claro ? luminanciaDe(x[0], x[1], x[2]) >= LUM_CLARO_MIN : luminanciaDe(x[0], x[1], x[2]) <= LUM_OSCURO_MAX)
  if (cumple(c)) return c
  let lo = 0
  let hi = 1
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2
    if (cumple(mezcla(c, destino, mid))) hi = mid
    else lo = mid
  }
  return mezcla(c, destino, hi)
}
const mezcla = (a, b, t) => a.map((v, i) => v + (b[i] - v) * acotar(t))

/** Coeficientes de Perez en funcion de la turbidez, segun Preetham. */
function coeficientes(T) {
  return {
    A: 0.1787 * T - 1.4630,
    B: -0.3554 * T + 0.4275,
    C: -0.0227 * T + 5.3251,
    D: 0.1206 * T - 2.5771,
    E: -0.0670 * T + 0.3703,
  }
}

function perez({ A, B, C, D, E }, cosTheta, gamma) {
  const ct = Math.max(cosTheta, 0.01)
  const cg = Math.cos(gamma)
  return (
    (1 + A * Math.exp(B / ct)) *
    (1 + C * Math.exp(D * gamma) + E * cg * cg)
  )
}

/**
 * Turbidez derivada de datos atmosfericos reales.
 * 2 es aire de montana muy limpio, 10 es bruma urbana densa.
 */
export function turbidezDe(escena) {
  const base = 2.2
  const porHumedad = escena.bruma * 3.4
  const porPolvo = escena.aire.polvo * 3.0
  const porNiebla = escena.niebla * 2.6
  return acotar(base + porHumedad + porPolvo + porNiebla, 1.8, 9.5)
}

/**
 * Rinde el cielo a un ImageData de baja resolucion.
 *
 * La malla es deliberadamente gruesa: al escalarla con suavizado al lienzo
 * final el resultado es indistinguible de evaluar por pixel y cuesta dos
 * ordenes de magnitud menos. Se recalcula solo cuando cambia el estado, no
 * cada cuadro.
 *
 * @param {object} escena salida de construirEscena
 * @param {object} paleta salida de paletaFondo
 * @param {number} ancho columnas de la malla
 * @param {number} alto filas de la malla
 * @returns {ImageData}
 */
export function renderCielo(escena, paleta, ancho, alto) {
  const img = new ImageData(ancho, alto)
  const d = img.data
  const T = turbidezDe(escena)
  const co = coeficientes(T)

  // Posicion del sol en el marco de la escena. El eje vertical del lienzo
  // cubre desde el cenit hasta algo por debajo del horizonte.
  const solX = escena.astro.x
  const solY = escena.astro.y * 0.78
  const nocturno = paleta.polaridad === 'oscuro'

  const cenit = leer(paleta.cenit)
  const horizonte = leer(paleta.horizonte)
  const calido = nocturno ? PALETA.salviaClara : PALETA.terracota

  // Normalizacion: valor de Perez en el cenit, para trabajar en relativo.
  const refCenit = perez(co, 1, Math.acos(acotar(1 - solY, -1, 1)))

  for (let j = 0; j < alto; j++) {
    const v = j / (alto - 1)
    // Angulo cenital aproximado de la fila.
    const theta = (v * 0.92 + 0.04) * (Math.PI / 2)
    const cosTheta = Math.cos(theta)

    for (let i = 0; i < ancho; i++) {
      const u = i / (ancho - 1)
      // Distancia angular al sol sobre el plano de la escena.
      const dx = (u - solX) * 1.9
      const dy = (v - solY) * 1.25
      const gamma = acotar(Math.sqrt(dx * dx + dy * dy) * 1.55, 0, Math.PI)

      const L = perez(co, cosTheta, gamma) / refCenit

      // Base cromatica: interpolacion cenit a horizonte por altura.
      let c = mezcla(cenit, horizonte, Math.pow(v, 1.35))

      // Aureola: el exceso de luminancia respecto de la base tiñe hacia el
      // color calido y sube el brillo. Acotado para no romper el contraste.
      const exceso = acotar((L - 1) * 0.42, 0, 0.55)
      c = mezcla(c, calido, exceso * (nocturno ? 0.32 : 0.62))

      // Modulacion de brillo dentro de un margen estrecho: la luminancia
      // global la fija paletaFondo y no se toca aqui.
      const k = 1 + acotar((L - 1) * 0.16, -0.1, 0.18)

      let px = [acotar(c[0] * k, 0, 255), acotar(c[1] * k, 0, 255), acotar(c[2] * k, 0, 255)]
      // Toda la forma del cielo se conserva; solo se acota su luminancia.
      px = acotarLuminancia(px, nocturno ? PALETA.tintaProfunda : PALETA.cremaClaro, !nocturno)

      const p = (j * ancho + i) * 4
      d[p] = px[0]
      d[p + 1] = px[1]
      d[p + 2] = px[2]
      d[p + 3] = 255
    }
  }
  return img
}

function leer(s) {
  const m = s.match(/[\d.]+/g)
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}
