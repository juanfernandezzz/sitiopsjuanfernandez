import {
  posicionSolar,
  posicionLunar,
  faseDelDia,
  longitudDesdeZonaHoraria,
} from './solar.js'

/**
 * Modelo de la escena ambiental.
 *
 * Traduce el estado atmosferico real del visitante a parametros continuos
 * de render. La diferenciacion entre climas se resuelve por morfologia
 * (forma, color, comportamiento de las particulas) y no por dramatismo,
 * de modo que estados muy distintos se reconocen de inmediato sin que
 * ninguno resulte agresivo para alguien que llega angustiado.
 *
 * Toda la paleta deriva del sistema de color del sitio.
 */

const PALETA = {
  crema: [246, 241, 232],
  cremaClaro: [255, 253, 248],
  salvia: [63, 91, 74],
  salviaClara: [168, 181, 160],
  terracota: [201, 123, 94],
  terracotaProfunda: [164, 88, 59],
  tinta: [42, 59, 76],
  tintaProfunda: [22, 33, 45],
}

/**
 * Rango termico real de Chile continental, no estimado.
 * Maxima absoluta: 42.2 C, Los Angeles, Region del Biobio, enero de 2017.
 * Minima absoluta: -28.5 C, Balmaceda, Region de Aysen, junio de 1958.
 * Ambos son registros oficiales validados por la Direccion Meteorologica
 * de Chile. Amplitud total: 70.7 grados.
 *
 * Los tramos siguen umbrales climaticamente significativos y no una
 * division aritmetica, de modo que el frio austral y altiplanico ocupa
 * su propio territorio del eje en vez de comprimirse contra el borde.
 */
const TRAMOS_TERMICOS = [
  [-28.5, 0.0], // record absoluto, Balmaceda 1958
  [-18.0, 0.08], // helada extrema de estepa y altiplano
  [-10.0, 0.17], // helada severa austral
  [-3.0, 0.27], // helada comun en el sur y la cordillera
  [2.0, 0.36], // cercania al congelamiento
  [8.0, 0.46], // invierno costero y central
  [13.1, 0.56], // media nacional anual segun la DMC
  [19.0, 0.66], // templado
  [26.0, 0.78], // verano calido
  [33.0, 0.89], // umbral de ola de calor en la zona central
  [42.2, 1.0], // record absoluto, Los Angeles 2017
]

const acotar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))

/** Interpolacion por tramos del eje termico. */
function mapaTermico(temp) {
  const t = Math.max(TRAMOS_TERMICOS[0][0], Math.min(TRAMOS_TERMICOS[TRAMOS_TERMICOS.length - 1][0], temp))
  for (let i = 0; i < TRAMOS_TERMICOS.length - 1; i++) {
    const [t0, v0] = TRAMOS_TERMICOS[i]
    const [t1, v1] = TRAMOS_TERMICOS[i + 1]
    if (t <= t1) return v0 + ((t - t0) / (t1 - t0)) * (v1 - v0)
  }
  return 1
}
const mezcla = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * acotar(t)))
const rgba = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
const suave = (t) => t * t * (3 - 2 * t)
const rango = (v, min, max) => acotar((v - min) / (max - min))

/**
 * Familias de precipitacion derivadas del symbol_code de MET Norway.
 * El vocabulario completo combina prefijos light y heavy, sufijos
 * _day, _night y _polartwilight, y variantes andthunder.
 */
function leerSimbolo(codigo) {
  const s = (codigo || '').toLowerCase()
  const base = s.replace(/_(day|night|polartwilight)$/, '')

  let tipo = 'ninguna'
  if (base.includes('snow')) tipo = 'nieve'
  else if (base.includes('sleet')) tipo = 'aguanieve'
  else if (base.includes('rain')) tipo = 'lluvia'

  let fuerza = 0.55
  if (base.startsWith('light') || base.startsWith('lights')) fuerza = 0.3
  if (base.startsWith('heavy')) fuerza = 1

  return {
    tipo,
    fuerza,
    chubasco: base.includes('showers'),
    trueno: base.includes('thunder'),
    niebla: base === 'fog',
    despejado: base === 'clearsky' || base === 'fair',
  }
}

/**
 * @param {object|null} clima respuesta de /api/ambiente
 * @param {Date} fecha
 * @returns {object} parametros de render
 */
export function construirEscena(clima, fecha = new Date()) {
  const hayClima = Boolean(clima && clima.ok)

  const lat = hayClima && typeof clima.lat === 'number' ? clima.lat : -33
  const lon = hayClima && typeof clima.lon === 'number' ? clima.lon : longitudDesdeZonaHoraria(fecha)

  const sol = posicionSolar(fecha, lat, lon)
  const fase = faseDelDia(sol.altitud)
  const luna = posicionLunar(fecha, lat, lon)

  // Luz: 0 en noche cerrada, 1 en mediodia alto.
  const luz = suave(rango(sol.altitud, -8, 45))
  // Calidez: maxima cuando el sol roza el horizonte.
  const calidez = sol.altitud > -8 && sol.altitud < 14 ? suave(1 - Math.abs(sol.altitud - 3) / 11) : 0

  // El astro recorre el eje horizontal segun el angulo horario real:
  // negativo antes del mediodia, cero en el transito, positivo despues.
  // Se usa el angulo horario y no el azimut porque en el hemisferio sur el
  // azimut cruza el norte al mediodia y produciria un salto en pantalla.
  const nocturno = sol.altitud < -6
  const horarioAstro = nocturno ? luna.anguloHorario : sol.anguloHorario
  const altitudAstro = nocturno ? luna.altitud : sol.altitud
  const posX = acotar(0.5 + (horarioAstro / 95) * 0.42, 0.04, 0.96)
  const posY = 1 - acotar(rango(altitudAstro, -6, 70))

  const s = leerSimbolo(hayClima ? clima.simbolo : null)

  const nubeBaja = hayClima ? valor(clima.nubes?.baja, s.despejado ? 0.05 : 0.4) : 0.18
  const nubeMedia = hayClima ? valor(clima.nubes?.media, 0.2) : 0.1
  const nubeAlta = hayClima ? valor(clima.nubes?.alta, 0.15) : 0.22
  const nubeTotal = hayClima ? valor(clima.nubes?.total, Math.max(nubeBaja, nubeMedia, nubeAlta)) : 0.2

  const humedad = hayClima ? valor(clima.aire?.humedad, 0.6) : 0.5
  const temp = hayClima ? valor(clima.aire?.temp, 14) : 14
  const presion = hayClima ? valor(clima.aire?.presion, 1013) : 1013
  const uv = hayClima ? valor(clima.uv, 3) : 3
  const rocio = hayClima ? valor(clima.aire?.rocio, temp - 5) : 9

  const nieblaDato = hayClima ? valor(clima.niebla, 0) : 0
  // Camanchaca: humedad alta y punto de rocio pegado a la temperatura.
  const nieblaInferida = acotar((humedad - 0.88) * 6) * acotar(1 - Math.abs(temp - rocio) / 3)
  const niebla = acotar(Math.max(nieblaDato, s.niebla ? 0.75 : 0, nieblaInferida))

  const vientoVel = hayClima ? valor(clima.viento?.vel, 3) : 3
  const vientoDir = hayClima ? valor(clima.viento?.dir, 270) : 270
  // El viento sopla hacia el rumbo opuesto al de procedencia.
  const derivaX = -Math.sin(vientoDir * (Math.PI / 180))

  const mm = hayClima ? valor(clima.precip?.mm, 0) : 0
  const intensidadPrecip =
    s.tipo === 'ninguna' ? 0 : acotar(Math.max(s.fuerza * 0.6, rango(mm, 0, 4)))

  const trueno = s.trueno ? acotar(valor(hayClima ? clima.precip?.trueno : 0, 0.4), 0.25, 0.6) : 0

  // Presion baja da un cielo mas plomizo, sin oscurecerlo de golpe.
  const pesadez = acotar(rango(1018 - presion, 0, 22))

  /**
   * Canal morfologico de la temperatura.
   *
   * Un solo eje de color no puede hacer perceptibles cinco grados dentro de
   * un rango de 70.7: la diferencia queda bajo el umbral de deteccion visual.
   * Por eso la temperatura tambien controla la cualidad visible del aire,
   * que es un canal independiente y no compite con la luz ni con las nubes.
   *
   * Frio: polvo de diamante y halo de cristales de hielo, ambos fenomenos
   * reales del aire muy frio y seco. Su densidad crece de forma continua,
   * asi que -10 se lee distinto de -5 sin recurrir al color.
   * Calor: ondulacion termica sobre el horizonte y polvo en suspension.
   */
  const escarcha = acotar(rango(-2 - temp, 0, 20)) * acotar(1 - humedad * 0.5) * acotar(1 - precipitacionActiva(s))
  const haloHielo = acotar(rango(-5 - temp, 0, 18)) * acotar(1 - nubeTotal * 0.6)
  const ondulacion = acotar(rango(temp, 26, 40)) * acotar(1 - nubeTotal * 0.7)
  const polvo = acotar(rango(temp, 24, 38)) * acotar(1 - humedad * 1.1) * acotar(1 - nubeTotal * 0.5)
  // Bruma: humedad relativa alta con cielo abierto.
  const bruma = acotar(rango(humedad, 0.55, 1) * (1 - niebla * 0.6))

  return {
    fase,
    luz,
    calidez,
    luna: nocturno ? luna.iluminacion : 0,
    astro: { x: posX, y: posY, altitud: altitudAstro },
    dureza: acotar(rango(uv, 0, 11)),
    temperatura: mapaTermico(temp),
    tempC: temp,
    aire: { escarcha, haloHielo, ondulacion, polvo },
    bruma,
    niebla,
    pesadez,
    capas: [
      { cobertura: nubeAlta, altura: 0.16, escala: 2.4, velocidad: 0.45, opacidad: 0.3 },
      { cobertura: nubeMedia, altura: 0.34, escala: 1.5, velocidad: 0.85, opacidad: 0.5 },
      { cobertura: nubeBaja, altura: 0.55, escala: 1, velocidad: 1.4, opacidad: 0.72 },
    ],
    nubeTotal,
    viento: { fuerza: acotar(rango(vientoVel, 0, 22)), deriva: derivaX },
    precip: { tipo: s.tipo, intensidad: intensidadPrecip, chubasco: s.chubasco },
    trueno,
    paleta: construirPaleta({
      luz,
      calidez,
      nubeTotal,
      niebla,
      pesadez,
      termico: mapaTermico(temp),
      uv,
      luna: nocturno ? luna.iluminacion : 0,
      fase,
    }),
    real: hayClima,
    lat,
    lon,
  }
}

function precipitacionActiva(simbolo) {
  return simbolo.tipo === 'ninguna' ? 0 : 1
}

function valor(v, porDefecto) {
  return typeof v === 'number' && Number.isFinite(v) ? v : porDefecto
}

/**
 * Deriva la paleta de la escena dentro del sistema de color del sitio.
 * Nunca introduce tonos ajenos: todo se resuelve mezclando crema, salvia,
 * terracota y tinta.
 */
function construirPaleta({ luz, calidez, nubeTotal, niebla, pesadez, termico, uv, luna, fase }) {
  const nocturno = fase === 'noche' || fase === 'noche-clara'

  // Cenit: de tinta profunda en la noche a crema abierta en el dia.
  let cenit = mezcla(PALETA.tintaProfunda, PALETA.crema, luz)
  // Horizonte: siempre mas claro y mas calido que el cenit.
  let horizonte = mezcla(PALETA.tinta, PALETA.cremaClaro, acotar(luz * 1.25))

  // El sol rasante tine el horizonte de terracota.
  horizonte = mezcla(horizonte, PALETA.terracota, calidez * 0.75)
  cenit = mezcla(cenit, PALETA.terracotaProfunda, calidez * 0.28)

  // La cobertura nubosa y la presion baja aplanan el cielo. De dia lo
  // desaturan hacia salvia clara, de noche lo cierran hacia tinta profunda.
  const plomo = acotar(nubeTotal * 0.55 + pesadez * 0.35)
  const destino = nocturno ? PALETA.tintaProfunda : PALETA.salviaClara
  const fuerzaPlomo = nocturno ? plomo * 0.45 : plomo * 0.55
  cenit = mezcla(cenit, destino, fuerzaPlomo)
  horizonte = mezcla(horizonte, destino, fuerzaPlomo * 0.72)

  // Eje termico. El frio empuja el cenit hacia salvia profunda, el calor
  // blanquea el horizonte, que es lo que ocurre de verdad con calor extremo.
  const frio = acotar((0.56 - termico) / 0.56)
  const calor = acotar((termico - 0.66) / 0.34)
  cenit = mezcla(cenit, PALETA.salvia, frio * 0.42)
  horizonte = mezcla(horizonte, PALETA.salviaClara, frio * 0.24)
  horizonte = mezcla(horizonte, PALETA.cremaClaro, calor * 0.5)
  cenit = mezcla(cenit, PALETA.terracota, calor * 0.14)

  // La niebla aplana el contraste entre cenit y horizonte.
  const velo = mezcla(cenit, horizonte, 0.5)
  cenit = mezcla(cenit, velo, niebla * 0.7)
  horizonte = mezcla(horizonte, velo, niebla * 0.7)

  // Luz nocturna con luna alta.
  if (nocturno && luna > 0.35) {
    cenit = mezcla(cenit, PALETA.salviaClara, (luna - 0.35) * 0.22)
  }

  const astro = nocturno
    ? rgba(mezcla(PALETA.cremaClaro, PALETA.salviaClara, 0.35), 0.55 + luna * 0.35)
    : rgba(mezcla(PALETA.cremaClaro, PALETA.terracota, calidez * 0.8), 0.85)

  const halo = nocturno
    ? rgba(PALETA.salviaClara, 0.16 + luna * 0.14)
    : rgba(mezcla(PALETA.cremaClaro, PALETA.terracota, calidez), 0.1 + acotar(uv / 11) * 0.24)

  return {
    cenit: rgba(cenit),
    horizonte: rgba(horizonte),
    astroColor: astro,
    haloColor: halo,
    nube: nocturno ? rgba(PALETA.tinta, 0.5) : rgba(mezcla(PALETA.cremaClaro, PALETA.salviaClara, plomo), 0.62),
    nubeBorde: nocturno
      ? rgba(mezcla(PALETA.tinta, PALETA.salviaClara, 0.3), 0.32)
      : rgba(PALETA.cremaClaro, 0.5),
    particula: nocturno ? rgba(PALETA.salviaClara, 0.5) : rgba(mezcla(PALETA.salvia, PALETA.cremaClaro, 0.55), 0.55),
    nieve: nocturno ? rgba(PALETA.cremaClaro, 0.62) : rgba(PALETA.cremaClaro, 0.88),
    nieblaColor: nocturno ? rgba(PALETA.tinta, 0.3) : rgba(PALETA.crema, 0.42),
    escarchaColor: nocturno ? rgba(PALETA.cremaClaro, 0.75) : rgba(PALETA.cremaClaro, 0.95),
    haloAnillo: nocturno ? rgba(PALETA.salviaClara, 0.3) : rgba(PALETA.cremaClaro, 0.45),
    polvoColor: rgba(mezcla(PALETA.terracota, PALETA.crema, 0.45), 0.3),
  }
}

export { PALETA }


/* ------------------------------------------------------------------ *
 * Modo fondo
 *
 * Cuando la escena vive detras de texto, la luminancia deja de ser un
 * canal disponible.
 *
 * Medicion sobre los estados reales: con el rango completo de luminancia,
 * el amanecer, el atardecer y el crepusculo caen en la zona media, donde
 * ni Ink ni Off-white alcanzan 4.5:1. Corregirlo con un velo exige hasta
 * 64 por ciento de opacidad, que borra la escena justo en sus momentos
 * mas expresivos.
 *
 * La solucion es desacoplar luminancia de tinte. La luminancia hace snap a
 * uno de dos polos seguros y toda la expresion del estado se traslada al
 * tinte, la saturacion y la textura, que no afectan el contraste.
 *
 * Umbrales calculados para 7:1 (AAA) contra los dos colores de texto del
 * sistema: polo claro sobre 0.62 de luminancia relativa, polo oscuro bajo
 * 0.096. La franja entre ambos queda prohibida.
 * ------------------------------------------------------------------ */

const INK = [42, 59, 76]
const OFF_WHITE = [255, 253, 248]
const LUM_CLARO_MIN = 0.66
const LUM_OSCURO_MAX = 0.075

const canalLineal = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/** Luminancia relativa segun WCAG 2.1. */
export function luminancia([r, g, b]) {
  return 0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b)
}

/** Razon de contraste segun WCAG 2.1. */
export function contraste(a, b) {
  const l1 = luminancia(a)
  const l2 = luminancia(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const leerRgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number)

/**
 * Empuja un color hasta alcanzar la luminancia objetivo conservando su
 * tinte todo lo posible. Busqueda binaria sobre la mezcla.
 */
function forzarLuminancia(color, destino, objetivo, haciaArriba) {
  const cumple = (c) => (haciaArriba ? luminancia(c) >= objetivo : luminancia(c) <= objetivo)
  if (cumple(color)) return color
  let lo = 0
  let hi = 1
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    if (cumple(mezcla(color, destino, mid))) hi = mid
    else lo = mid
  }
  return mezcla(color, destino, hi)
}

/**
 * Paleta para usar la escena como fondo de una seccion con texto.
 * Garantiza AAA contra el color de texto que devuelve.
 *
 * @param {object} escena salida de construirEscena
 * @returns {object} paleta con contraste garantizado
 */
export function paletaFondo(escena) {
  const claro = escena.luz > 0.34
  const objetivo = claro ? LUM_CLARO_MIN : LUM_OSCURO_MAX
  const destino = claro ? PALETA.cremaClaro : PALETA.tintaProfunda

  const cenit = forzarLuminancia(leerRgb(escena.paleta.cenit), destino, objetivo, claro)
  const horizonte = forzarLuminancia(leerRgb(escena.paleta.horizonte), destino, objetivo, claro)
  const nubeBase = forzarLuminancia(leerRgb(escena.paleta.nube), destino, objetivo, claro)

  const nubeBaseRgb = nubeBase
  const texto = claro ? INK : OFF_WHITE
  const peor = Math.min(contraste(texto, cenit), contraste(texto, horizonte), contraste(texto, nubeBase))

  /**
   * Opacidad minima del velo de legibilidad, resuelta y no fijada a ojo.
   *
   * El velo se aplica sobre la escena ya compuesta. Si L es la luminancia
   * del punto mas extremo que la escena puede alcanzar y Lc la del cenit,
   * tras el velo de opacidad a queda:  Lf = (1 - a) L + a Lc
   *
   * Se busca la a mas baja que aun deja el contraste en 7:1, porque cada
   * punto de opacidad de mas es movimiento que el visitante deja de ver.
   * Antes estaba en 0.94 y 0.965 fijos, que borraban la animacion entera.
   */
  // Los extremos se evaluan YA atenuados: sobre la caja de texto el motor
  // dibuja las particulas al 30 por ciento, asi que el pico que el velo debe
  // compensar es mucho menor que el del resto del lienzo.
  const ATENUA_TEXTO = 0.1
  /**
   * Opacidad minima del velo de legibilidad, resuelta y no fijada a ojo.
   *
   * Sobre la escena compuesta, un velo de opacidad a deja
   *   Lf = (1 - a) L + a Lcenit
   * Se busca la a mas baja que aun sostiene 7:1, porque cada punto de
   * opacidad de mas es movimiento que el visitante deja de ver.
   *
   * Hay dos grupos de elementos y NO se comportan igual:
   *
   *  - Particulas (lluvia, nieve, escarcha, polvo, brisa, estrellas, aves):
   *    el motor las dibuja al ATENUA_TEXTO de su brillo cuando caen sobre la
   *    caja de texto, asi que su aporte llega ya reducido.
   *  - Nubes: se componen con drawImage sobre una textura, no por particula,
   *    de modo que NO pasan por esa atenuacion y aportan su luminancia
   *    entera. Tratarlas como atenuadas fue el error que dejo un quinto de
   *    los estados bajo AAA en la primera auditoria.
   */
  const ATENUA_PARTICULA = 0.1
  const resolverA = (lExt) => {
    const objetivo = claro ? 7 * (lTexto + 0.05) - 0.05 : (lTexto + 0.05) / 7 - 0.05
    if (!(claro ? lExt < objetivo : lExt > objetivo)) return 0
    const denom = lCenit - lExt
    return Math.min(1, Math.max(0, Math.abs(denom) < 1e-6 ? 1 : (objetivo - lExt) / denom))
  }

  const lCenit = luminancia(cenit)
  const lTexto = luminancia(texto)

  // Particulas: llegan atenuadas, pero varias pueden superponerse.
  const particulas = claro
    ? [mezcla(PALETA.salvia, PALETA.cremaClaro, 0.55)]
    : [OFF_WHITE]
  // Tres capas superpuestas es el peor caso realista.
  const aporteParticula = Math.min(1, ATENUA_PARTICULA * 3)

  // Nubes: aportan su luminancia completa, sin atenuar.
  const cimaRgb = claro
    ? mezcla(PALETA.cremaClaro, PALETA.terracota, escena.calidez * 0.45)
    : mezcla(PALETA.salviaClara, PALETA.tinta, 0.35)
  const nubesExtremas = [nubeBase, cimaRgb]

  let opacidadVelo = 0
  for (const c of particulas) {
    opacidadVelo = Math.max(opacidadVelo, resolverA(luminancia(mezcla(cenit, c, aporteParticula))))
  }
  for (const c of nubesExtremas) {
    opacidadVelo = Math.max(opacidadVelo, resolverA(luminancia(c)))
  }
  // Margen contra acumulacion. Calibrado con scripts/auditar-escena.mjs,
  // que mide sobre pixeles rasterizados de verdad.
  opacidadVelo = Math.min(0.92, opacidadVelo * 1.08 + 0.1)

  return {
    polaridad: claro ? 'claro' : 'oscuro',
    cenit: rgba(cenit),
    horizonte: rgba(horizonte),
    // El texto y sus variantes derivan del polo, no del estado del cielo.
    texto: rgba(texto),
    textoSuave: rgba(mezcla(texto, claro ? cenit : horizonte, 0.28)),
    borde: rgba(texto, 0.16),
    // Los elementos de la escena se atenuan para no competir con la lectura.
    nube: rgba(nubeBase, claro ? 0.4 : 0.5),
    nubeBorde: rgba(mezcla(nubeBase, destino, 0.4), 0.25),
    astroColor: rgba(claro ? mezcla(PALETA.cremaClaro, PALETA.terracota, escena.calidez * 0.6) : PALETA.salviaClara, claro ? 0.5 : 0.35),
    haloColor: rgba(claro ? PALETA.terracota : PALETA.salviaClara, 0.08 + escena.calidez * 0.1),
    particula: rgba(claro ? PALETA.salvia : PALETA.salviaClara, 0.28),
    nieve: rgba(claro ? PALETA.salviaClara : PALETA.cremaClaro, 0.4),
    nieblaColor: rgba(claro ? PALETA.crema : PALETA.tinta, 0.22),
    escarchaColor: rgba(claro ? PALETA.salviaClara : PALETA.cremaClaro, 0.5),
    haloAnillo: rgba(claro ? PALETA.salviaClara : PALETA.cremaClaro, 0.2),
    polvoColor: rgba(mezcla(PALETA.terracota, destino, 0.35), 0.3),

    // Nubes: base en sombra y cima iluminada. El gradiente entre ambas
    // dentro de la textura es lo que da volumen en vez de mancha plana.
    nubeBase: rgba(
      claro
        ? mezcla(mezcla(nubeBaseRgb, PALETA.salviaClara, 0.4), destino, 0.15)
        : mezcla(nubeBaseRgb, PALETA.tinta, 0.45)
    ),
    nubeCima: rgba(
      claro
        ? mezcla(PALETA.cremaClaro, PALETA.terracota, escena.calidez * 0.45)
        : mezcla(PALETA.salviaClara, PALETA.tinta, 0.35)
    ),
    nubeAlpha: claro ? 0.66 : 0.58,

    haloMedio: rgba(claro ? PALETA.terracota : PALETA.salviaClara, 0.05 + escena.calidez * 0.07),
    rayoColor: rgba(claro ? mezcla(PALETA.cremaClaro, PALETA.terracota, 0.35) : PALETA.salviaClara),
    estrellaColor: rgba(PALETA.cremaClaro),
    brisaColor: rgba(claro ? mezcla(PALETA.salvia, PALETA.cremaClaro, 0.35) : PALETA.salviaClara),
    aveColor: rgba(claro ? mezcla(PALETA.tinta, PALETA.salvia, 0.4) : PALETA.tintaProfunda),
    trazoColor: rgba(PALETA.salviaClara),

    contrastePeor: peor,
    opacidadVelo,
  }
}
