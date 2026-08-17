/**
 * Posicion solar y lunar calculada localmente.
 * Sin red, sin permisos, sin dependencias. Algoritmo NOAA Solar Calculator.
 *
 * Se usa para que el astro de la escena ambiental aparezca en la misma
 * posicion real que ocupa en el cielo del visitante, y para derivar
 * amanecer, crepusculo, mediodia y noche sin llamar a ninguna API.
 */

const RAD = Math.PI / 180
const SINODICO = 29.530588853
const LUNA_NUEVA_REF = Date.UTC(2000, 0, 6, 18, 14, 0)

const diaJuliano = (fecha) => fecha.getTime() / 86400000 + 2440587.5
const acotar = (v, min, max) => Math.max(min, Math.min(max, v))

/**
 * @param {Date} fecha
 * @param {number} lat grados, positivo norte
 * @param {number} lon grados, positivo este
 * @returns {{altitud:number, azimut:number, declinacion:number, anguloHorario:number}} grados
 */
export function posicionSolar(fecha, lat, lon) {
  const t = (diaJuliano(fecha) - 2451545.0) / 36525.0

  let L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
  if (L0 < 0) L0 += 360

  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)

  const C =
    Math.sin(M * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * M * RAD) * 0.000289

  const longVerdadera = L0 + C
  const omega = 125.04 - 1934.136 * t
  const lambda = longVerdadera - 0.00569 - 0.00478 * Math.sin(omega * RAD)

  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD)

  const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD

  const y = Math.pow(Math.tan((eps / 2) * RAD), 2)
  const ecuacionTiempo =
    (4 *
      (y * Math.sin(2 * L0 * RAD) -
        2 * e * Math.sin(M * RAD) +
        4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
        0.5 * y * y * Math.sin(4 * L0 * RAD) -
        1.25 * e * e * Math.sin(2 * M * RAD))) /
    RAD

  const minutosUTC =
    fecha.getUTCHours() * 60 + fecha.getUTCMinutes() + fecha.getUTCSeconds() / 60

  let tst = (minutosUTC + ecuacionTiempo + 4 * lon) % 1440
  if (tst < 0) tst += 1440

  let H = tst / 4 - 180
  if (H < -180) H += 360

  const latR = lat * RAD
  const decR = dec * RAD
  const HR = H * RAD

  const cosZ = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(HR)
  const altitud = 90 - Math.acos(acotar(cosZ, -1, 1)) / RAD

  let azimut =
    Math.atan2(Math.sin(HR), Math.cos(HR) * Math.sin(latR) - Math.tan(decR) * Math.cos(latR)) / RAD +
    180
  azimut = (azimut + 360) % 360

  // El angulo horario es monotono a lo largo del dia y funciona igual en
  // ambos hemisferios. El azimut, en cambio, cruza el norte al mediodia en
  // latitudes australes, por lo que no sirve para posicionar el astro.
  return { altitud, azimut, declinacion: dec, anguloHorario: H }
}

/**
 * Posicion lunar aproximada.
 *
 * No usa efemerides completas. Deriva el angulo horario lunar del solar
 * desplazado por la fase (la luna se retrasa cerca de 50 minutos por dia)
 * y aproxima su declinacion interpolando entre la solar y su opuesta segun
 * la fase, que es exacto en luna llena y aceptable en fases intermedias.
 * Suficiente para ubicar el astro en una escena, no para navegar.
 *
 * @returns {{altitud:number, anguloHorario:number, iluminacion:number}}
 */
export function posicionLunar(fecha, lat, lon) {
  const sol = posicionSolar(fecha, lat, lon)
  const fase = faseLunar(fecha)

  let H = sol.anguloHorario - 360 * fase
  H = ((H + 540) % 360) - 180

  // En luna nueva comparte declinacion con el sol, en luna llena la opuesta.
  const decLuna = sol.declinacion * Math.cos(2 * Math.PI * fase)

  const latR = lat * RAD
  const decR = decLuna * RAD
  const HR = H * RAD
  const cosZ = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(HR)
  const altitud = 90 - Math.acos(acotar(cosZ, -1, 1)) / RAD

  return { altitud, anguloHorario: H, iluminacion: (1 - Math.cos(2 * Math.PI * fase)) / 2 }
}

/** 0 = luna nueva, 0.5 = luna llena. */
export function faseLunar(fecha) {
  const dias = (fecha.getTime() - LUNA_NUEVA_REF) / 86400000
  let f = (dias % SINODICO) / SINODICO
  if (f < 0) f += 1
  return f
}

/** Fraccion del disco lunar iluminada, 0 a 1. */
export function iluminacionLunar(fecha) {
  return (1 - Math.cos(2 * Math.PI * faseLunar(fecha))) / 2
}

/**
 * Fase del dia derivada de la altitud solar.
 * Los cortes siguen las definiciones estandar de crepusculo.
 */
export function faseDelDia(altitud) {
  if (altitud > 12) return 'dia'
  if (altitud > 2) return 'dorada'
  if (altitud > -6) return 'crepusculo'
  if (altitud > -18) return 'noche-clara'
  return 'noche'
}

/**
 * Longitud aproximada derivada del desfase horario del dispositivo.
 * Solo se usa cuando no hay geolocalizacion por IP disponible.
 */
export function longitudDesdeZonaHoraria(fecha = new Date()) {
  const offsetMin = -fecha.getTimezoneOffset()
  return acotar((offsetMin / 60) * 15, -180, 180)
}
