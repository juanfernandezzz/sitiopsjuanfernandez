/**
 * Cielo estrellado real.
 *
 * Catalogo abreviado de estrellas brillantes con enfasis en el hemisferio
 * sur, convertidas a coordenadas horizontales para la latitud y la hora del
 * visitante. Cuando es de noche en Chile, la Cruz del Sur aparece en la
 * escena donde esta de verdad en el cielo, con la inclinacion que le
 * corresponde a esa hora y a esa latitud.
 *
 * Precision: las coordenadas estan al centesimo de grado en epoca J2000 y
 * no se corrige precesion, aberracion ni refraccion. El error acumulado es
 * de fracciones de grado, invisible en una escena. Esto sirve para que se
 * reconozca el cielo propio, no para navegar.
 *
 * Ascension recta en grados, declinacion en grados, magnitud visual.
 */

const RAD = Math.PI / 180
const acotar = (v, a, b) => Math.max(a, Math.min(b, v))

// nombre, AR, Dec, magnitud
export const ESTRELLAS = [
  ['Sirio', 101.29, -16.72, -1.46],
  ['Canopus', 95.99, -52.7, -0.74],
  ['Rigil Kentaurus', 219.9, -60.83, -0.27],
  ['Arturo', 213.92, 19.18, -0.05],
  ['Vega', 279.23, 38.78, 0.03],
  ['Capella', 79.17, 46.0, 0.08],
  ['Rigel', 78.63, -8.2, 0.13],
  ['Proción', 114.83, 5.22, 0.34],
  ['Achernar', 24.43, -57.24, 0.46],
  ['Betelgeuse', 88.79, 7.41, 0.5],
  ['Hadar', 210.96, -60.37, 0.61],
  ['Altair', 297.7, 8.87, 0.77],
  ['Acrux', 186.65, -63.1, 0.76],
  ['Aldebarán', 68.98, 16.51, 0.85],
  ['Antares', 247.35, -26.43, 1.09],
  ['Spica', 201.3, -11.16, 0.98],
  ['Pólux', 116.33, 28.03, 1.14],
  ['Fomalhaut', 344.41, -29.62, 1.16],
  ['Mimosa', 191.93, -59.69, 1.25],
  ['Deneb', 310.36, 45.28, 1.25],
  ['Régulo', 152.09, 11.97, 1.4],
  ['Adhara', 104.66, -28.97, 1.5],
  ['Cástor', 113.65, 31.89, 1.58],
  ['Shaula', 263.4, -37.1, 1.62],
  ['Gacrux', 187.79, -57.11, 1.63],
  ['Bellatrix', 81.28, 6.35, 1.64],
  ['Elnath', 81.57, 28.61, 1.65],
  ['Miaplacidus', 138.3, -69.72, 1.67],
  ['Alnilam', 84.05, -1.2, 1.69],
  ['Alnair', 332.06, -46.96, 1.74],
  ['Alsephina', 131.18, -54.71, 1.75],
  ['Alnitak', 85.19, -1.94, 1.77],
  ['Alioth', 193.51, 55.96, 1.77],
  ['Dubhe', 165.93, 61.75, 1.79],
  ['Mirfak', 51.08, 49.86, 1.79],
  ['Wezen', 107.1, -26.39, 1.83],
  ['Avior', 125.63, -59.51, 1.86],
  ['Sargas', 264.33, -42.998, 1.87],
  ['Kaus Australis', 276.04, -34.38, 1.85],
  ['Atria', 252.17, -69.03, 1.91],
  ['Alkaid', 206.89, 49.31, 1.86],
  ['Peacock', 306.41, -56.74, 1.94],
  ['Polaris', 37.95, 89.26, 1.98],
  ['Mirzam', 95.67, -17.96, 1.98],
  ['Alphard', 141.9, -8.66, 2.0],
  ['Hamal', 31.79, 23.46, 2.0],
  ['Deneb Kaitos', 10.9, -17.99, 2.04],
  ['Menkalinan', 89.88, 44.95, 1.9],
  ['Delta Crucis', 183.79, -58.75, 2.79],
  ['Alpha Muscae', 189.3, -69.14, 2.69],
  ['Nunki', 283.82, -26.3, 2.05],
  ['Mintaka', 83.0, -0.3, 2.23],
]

/**
 * Trazos de constelacion. Solo la Cruz del Sur y el cinturon de Orion:
 * son las dos figuras que cualquiera reconoce desde Chile sin saber
 * astronomia. Indices sobre ESTRELLAS.
 */
export const TRAZOS = [
  [12, 24], // Acrux a Gacrux, brazo largo
  [18, 48], // Mimosa a Delta Crucis, brazo corto
  [28, 31], // Alnilam a Alnitak
  [51, 28], // Mintaka a Alnilam
]

/** Tiempo sidereo medio de Greenwich, en grados. */
function gmst(fecha) {
  const jd = fecha.getTime() / 86400000 + 2440587.5
  const d = jd - 2451545.0
  let g = 280.46061837 + 360.98564736629 * d
  g %= 360
  return g < 0 ? g + 360 : g
}

/**
 * Convierte el catalogo a posiciones en la escena.
 *
 * @param {Date} fecha
 * @param {number} lat grados
 * @param {number} lon grados, positivo este
 * @param {number} limiteMag magnitud limite segun cuanta luz haya
 *
 * El marco se centra en el sur celeste. Ver nota de encuadre mas abajo.
 * @returns {Array<{x:number,y:number,brillo:number,i:number}>}
 */
export function estrellasVisibles(fecha, lat, lon, limiteMag = 2.2) {
  const lst = gmst(fecha) + lon
  const latR = lat * RAD
  const senLat = Math.sin(latR)
  const cosLat = Math.cos(latR)
  const fuera = []

  for (let i = 0; i < ESTRELLAS.length; i++) {
    const [, ar, dec, mag] = ESTRELLAS[i]
    if (mag > limiteMag) continue

    let H = lst - ar
    H = ((H % 360) + 540) % 360 - 180
    const HR = H * RAD
    const decR = dec * RAD

    const senAlt = senLat * Math.sin(decR) + cosLat * Math.cos(decR) * Math.cos(HR)
    const alt = Math.asin(acotar(senAlt, -1, 1)) / RAD
    if (alt < 2) continue

    let az =
      Math.atan2(Math.sin(HR), Math.cos(HR) * senLat - Math.tan(decR) * cosLat) / RAD + 180
    az = ((az % 360) + 360) % 360

    // Proyeccion al marco de la escena.
    //
    // De dia la escena sigue al sol, que desde Chile culmina al NORTE.
    // De noche mira al SUR, que es donde esta lo que se reconoce desde aca:
    // la Cruz del Sur, Centauro y las Nubes de Magallanes. Es el encuadre
    // que adoptaria cualquiera parado afuera, y es el unico que hace visible
    // el cielo propio del visitante.
    let desvio = ((az - 180) % 360 + 540) % 360 - 180
    if (Math.abs(desvio) > 118) continue

    fuera.push({
      i,
      x: acotar(0.5 + desvio / 236, 0.01, 0.99),
      y: acotar(1 - alt / 88, 0.01, 0.99),
      // Escala de magnitud a brillo perceptual.
      brillo: acotar(Math.pow(2.512, -mag) * 2.6 + 0.16, 0.16, 1),
      mag,
    })
  }
  return fuera
}

/**
 * Trazos cuyos dos extremos estan visibles.
 * @returns {Array<[object, object]>}
 */
export function trazosVisibles(visibles) {
  const porIndice = new Map(visibles.map((e) => [e.i, e]))
  const fuera = []
  for (const [a, b] of TRAZOS) {
    const ea = porIndice.get(a)
    const eb = porIndice.get(b)
    if (ea && eb) fuera.push([ea, eb])
  }
  return fuera
}
