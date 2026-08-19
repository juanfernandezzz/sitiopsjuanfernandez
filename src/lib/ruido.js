/**
 * Ruido procedural.
 *
 * Value noise tileable en el eje horizontal, FBM y campo curl.
 *
 * El campo curl viene de Bridson, Hourihan y Nordenstam (SIGGRAPH 2007):
 * tomar el rotacional de un potencial escalar produce un campo de velocidad
 * de divergencia cero. En dos dimensiones eso es v = (dPsi/dy, -dPsi/dx).
 * La propiedad importante para nosotros es que las particulas nunca se
 * agrupan ni dejan huecos, que es lo que delata a un sistema de particulas
 * barato. El movimiento se lee como aire, no como puntos cayendo.
 *
 * Todo es escalar y sin dependencias. Dos evaluaciones de ruido por
 * particula por cuadro.
 */

const TAM = 256
const MASCARA = TAM - 1

// Tabla de permutacion con semilla fija: la escena debe verse igual
// entre recargas para un mismo estado del cielo.
const perm = new Uint8Array(TAM * 2)
const grad = new Float32Array(TAM * 2)
;(function inicializar() {
  let s = 1013904223
  const aleatorio = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  const base = new Uint8Array(TAM)
  for (let i = 0; i < TAM; i++) base[i] = i
  for (let i = TAM - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    const t = base[i]
    base[i] = base[j]
    base[j] = t
  }
  for (let i = 0; i < TAM * 2; i++) {
    perm[i] = base[i & MASCARA]
    grad[i] = aleatorio() * 2 - 1
  }
})()

const suavizar = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (a, b, t) => a + (b - a) * t

/** Value noise 2D en el rango -1 a 1. */
export function ruido2(x, y) {
  const xi = Math.floor(x) & MASCARA
  const yi = Math.floor(y) & MASCARA
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const u = suavizar(xf)
  const v = suavizar(yf)

  const aa = grad[perm[perm[xi] + yi]]
  const ba = grad[perm[perm[(xi + 1) & MASCARA] + yi]]
  const ab = grad[perm[perm[xi] + ((yi + 1) & MASCARA)]]
  const bb = grad[perm[perm[(xi + 1) & MASCARA] + ((yi + 1) & MASCARA)]]

  return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v)
}

/**
 * Ruido fractal por suma de octavas.
 * Es lo que le da a una nube silueta con detalle en varias escalas en vez
 * de un borde de elipse.
 */
export function fbm(x, y, octavas = 4, lagunaridad = 2.03, ganancia = 0.5) {
  let suma = 0
  let amplitud = 1
  let frecuencia = 1
  let norma = 0
  for (let i = 0; i < octavas; i++) {
    suma += amplitud * ruido2(x * frecuencia, y * frecuencia)
    norma += amplitud
    amplitud *= ganancia
    frecuencia *= lagunaridad
  }
  return suma / norma
}

/**
 * Ruido con desplazamiento del dominio.
 * Alimentar el ruido con el resultado de otro ruido produce las volutas y
 * los enganches que tienen las nubes reales. Sin esto la silueta queda
 * ondulada pero inerte.
 */
export function fbmDeformado(x, y, t, intensidad = 1.4) {
  const qx = fbm(x, y, 3)
  const qy = fbm(x + 5.2, y + 1.3, 3)
  return fbm(x + intensidad * qx + t * 0.11, y + intensidad * qy, 4)
}

/**
 * Campo curl 2D: velocidad de divergencia cero derivada de un potencial.
 * @returns {[number, number]} componentes de velocidad
 */
export function curl(x, y, epsilon = 0.6) {
  const n1 = fbm(x, y + epsilon, 3)
  const n2 = fbm(x, y - epsilon, 3)
  const n3 = fbm(x + epsilon, y, 3)
  const n4 = fbm(x - epsilon, y, 3)
  const dpdy = (n1 - n2) / (2 * epsilon)
  const dpdx = (n3 - n4) / (2 * epsilon)
  return [dpdy, -dpdx]
}

/**
 * Campo curl precomputado sobre una malla.
 *
 * Evaluar el curl por particula por cuadro cuesta doce muestras de ruido
 * cada una: medido, 8.4 ms para 340 particulas, un cuarto del presupuesto
 * de cuadro a 30 fps. Inaceptable en gama media.
 *
 * En su lugar se precomputa el campo sobre una malla gruesa cada pocos
 * segundos y las particulas lo leen por interpolacion bilineal. Como el
 * campo es suave por construccion, la malla gruesa no introduce artefactos.
 * Para que la evolucion no salte, se interpola entre el campo anterior y el
 * nuevo durante la transicion.
 */
export function crearCampoCurl(cols = 26, filas = 18, periodoMs = 1600) {
  const n = cols * filas
  let actual = new Float32Array(n * 2)
  let previo = new Float32Array(n * 2)
  let ultimo = -Infinity
  let mezclaT = 1
  let fase = 0

  function generar(destino, escala, semilla) {
    for (let j = 0; j < filas; j++) {
      for (let i = 0; i < cols; i++) {
        const [vx, vy] = curl((i / cols) * escala + semilla, (j / filas) * escala, 0.6)
        const p = (j * cols + i) * 2
        destino[p] = vx
        destino[p + 1] = vy
      }
    }
  }

  return {
    /** @param {number} t tiempo en ms @param {number} escala escala espacial */
    actualizar(t, escala = 3.2) {
      if (t - ultimo >= periodoMs) {
        const tmp = previo
        previo = actual
        actual = tmp
        fase += 0.37
        generar(actual, escala, fase)
        ultimo = t
        mezclaT = 0
      }
      mezclaT = Math.min(1, (t - ultimo) / periodoMs)
    },

    /**
     * Lee el campo en coordenadas normalizadas 0 a 1 con interpolacion
     * bilineal y mezcla temporal.
     * @returns {[number, number]}
     */
    leer(u, v) {
      let x = u * (cols - 1)
      let y = v * (filas - 1)
      x = x < 0 ? 0 : x > cols - 1 ? cols - 1 : x
      y = y < 0 ? 0 : y > filas - 1 ? filas - 1 : y
      const i0 = Math.floor(x)
      const j0 = Math.floor(y)
      const i1 = i0 + 1 < cols ? i0 + 1 : i0
      const j1 = j0 + 1 < filas ? j0 + 1 : j0
      const fx = x - i0
      const fy = y - j0

      const idx = (i, j) => (j * cols + i) * 2
      const a = idx(i0, j0), b = idx(i1, j0), c = idx(i0, j1), d = idx(i1, j1)
      const m = mezclaT

      const vx =
        (actual[a] * m + previo[a] * (1 - m)) * (1 - fx) * (1 - fy) +
        (actual[b] * m + previo[b] * (1 - m)) * fx * (1 - fy) +
        (actual[c] * m + previo[c] * (1 - m)) * (1 - fx) * fy +
        (actual[d] * m + previo[d] * (1 - m)) * fx * fy
      const vy =
        (actual[a + 1] * m + previo[a + 1] * (1 - m)) * (1 - fx) * (1 - fy) +
        (actual[b + 1] * m + previo[b + 1] * (1 - m)) * fx * (1 - fy) +
        (actual[c + 1] * m + previo[c + 1] * (1 - m)) * (1 - fx) * fy +
        (actual[d + 1] * m + previo[d + 1] * (1 - m)) * fx * fy

      return [vx, vy]
    },
  }
}
