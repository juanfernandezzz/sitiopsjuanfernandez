/**
 * Nucleo compartido de "Respira conmigo". Fuente unica consumida por el sitio
 * (src/components/respira/RespiraVisor.jsx, que lo anima con CSS) y por la app
 * (app/src/components/RespiraVisor.jsx, que lo anima con Animated sobre
 * react-native-svg). La geometria, el sorteo y los numeros del ritmo viven
 * SOLO aqui: un cambio en este archivo se propaga al sitio en el mismo deploy
 * y a la app en el siguiente OTA (el postinstall lo sincroniza a
 * app/src/contenido en cada build y en cada publicacion).
 *
 * Codigo extraido verbatim del visor web (C24 fixpack 2); ver alli la
 * documentacion completa del diseno. Resumen:
 *  - Tres capas (velos, hojas, acentos) giran a periodos sorteados
 *    mutuamente inconmensurables; la configuracion relativa no se repite.
 *  - Tijera de alas: copias base y espejo oscilan en sentidos opuestos.
 *  - Pulso radial del anillo de acentos.
 *  - Normalizacion: cada sorteo se escala para que su elemento mas extenso
 *    bese RADIO_OBJETIVO a inhalacion completa, dentro del disco r=206.
 *
 * Regla de plataformas: este archivo es JavaScript puro. Nada de JSX, DOM,
 * CSS ni APIs de React Native; solo datos y funciones, para que ambas
 * superficies puedan importarlo sin tocarlo.
 */

/**
 * Rangos de movimiento comunes a TODOS los patrones. Lo que cambia entre un
 * patron y otro es el reparto del tiempo (las fases), no la figura ni su
 * amplitud: asi el ejercicio se siente el mismo y solo cambia el ritmo.
 *
 * El visor web inyecta estos valores como variables CSS (respira.css las
 * consume con fallback identico); el visor nativo los usa directamente en sus
 * interpolaciones.
 */
export const RESPIRA_VISUAL = {
  escalaExhalado: 0.68,
  escalaInhalado: 1,
  // Reposo de reduced motion: figura fija en un punto medio amable.
  escalaReposo: 0.8,
  // Curva de la respiracion (cubic-bezier), identica en CSS y en Animated.
  bezier: [0.45, 0, 0.55, 1],
  // Pulso radial del anillo de acentos.
  pulsoMin: 0.86,
  pulsoMax: 1,
};

/**
 * C41: el ejercicio pasa de un ritmo a dos patrones intercambiables desde el
 * mismo visor (un boton alterna entre ellos, en el sitio y en la app).
 *
 * Cada patron declara sus fases en orden; `s` son segundos y la suma tiene que
 * dar `cicloS`. La escala objetivo de cada fase se deriva de la clave:
 * inhalar sube a escalaInhalado, exhalar baja a escalaExhalado y sostener
 * mantiene la escala de la fase anterior (la figura queda quieta, expandida).
 *
 * Encuadre (verificado):
 *  - Respiracion coherente: respiracion a frecuencia de resonancia (~0,1 Hz,
 *    cercana a 6 rpm) con inhalacion y exhalacion equilibradas. Sincroniza
 *    respiracion y ritmo cardiaco y eleva la variabilidad de la frecuencia
 *    cardiaca; hay evidencia de ensayos en estres, ansiedad y cognicion.
 *  - 4-7-8: patron difundido por Andrew Weil, con exhalacion prolongada y
 *    apnea breve. La exhalacion mas larga que la inhalacion favorece el tono
 *    parasimpatico; la evidencia especifica de este patron es mas limitada que
 *    la de la respiracion coherente, por eso el copy no promete resultados y
 *    recomienda empezar con pocos ciclos. La apnea de 7 s es la parte que
 *    puede marear a quien recien empieza: la nota de seguridad no es adorno.
 *
 * ATENCION al editar los tiempos: respira.css tiene keyframes con porcentajes
 * fijos por patron (CSS no admite variables dentro de un @keyframes). Si
 * cambias `s` o `cicloS` aqui, hay que recalcular esos porcentajes alla; el
 * archivo lleva la cuenta anotada al lado de cada numero.
 *
 * CRITICO: cero em-dashes y cero en-dashes en el copy.
 */
export const RESPIRA_PATRONES = [
  {
    id: 'coherente',
    nombre: 'Respiración coherente',
    cicloS: 11,
    fases: [
      { clave: 'inhalar', cue: 'Inhala', s: 5.5 },
      { clave: 'exhalar', cue: 'Exhala', s: 5.5 },
    ],
    instruccion:
      'Inhala por la nariz mientras la figura se expande y exhala mientras se recoge, 5,5 segundos cada movimiento, sin forzar.',
    duracion: 'Practica entre 3 y 5 minutos, o el tiempo que te acomode.',
    // Etiqueta del boton mientras ESTE patron esta activo (lleva al otro).
    ctaCambio: 'Probar la respiración 4-7-8',
    estadoVivo:
      'Respiración coherente en marcha: inhala durante 5,5 segundos y exhala durante 5,5 segundos.',
    notaReducida:
      'Tu dispositivo indica que prefieres menos movimiento: la figura queda fija y el ritmo lo marcan las palabras Inhala y Exhala.',
    ...RESPIRA_VISUAL,
  },
  {
    id: 'cuatro78',
    nombre: 'Respiración 4-7-8',
    cicloS: 19,
    fases: [
      { clave: 'inhalar', cue: 'Inhala', s: 4 },
      { clave: 'sostener', cue: 'Sostén', s: 7 },
      { clave: 'exhalar', cue: 'Exhala', s: 8 },
    ],
    instruccion:
      'Inhala por la nariz mientras la figura se expande (4 segundos), sostén el aire mientras queda quieta (7) y exhala por la boca, con los labios entreabiertos, mientras se recoge (8).',
    duracion:
      'Empieza con 4 ciclos, poco más de un minuto. Si te acomoda, puedes repetirlo un par de veces al día.',
    ctaCambio: 'Volver a la respiración coherente',
    estadoVivo:
      'Respiración 4-7-8 en marcha: inhala 4 segundos, sostén el aire 7 segundos y exhala 8 segundos.',
    notaReducida:
      'Tu dispositivo indica que prefieres menos movimiento: la figura queda fija y el ritmo lo marcan las palabras Inhala, Sostén y Exhala.',
    ...RESPIRA_VISUAL,
  },
];

/**
 * Patron por omision (el que ve quien llega): la respiracion coherente, que es
 * la mejor respaldada y la mas facil de sostener sin instruccion previa.
 * Se mantiene el nombre RESPIRA_RITMO por compatibilidad con lo que ya lo
 * importaba.
 */
export const RESPIRA_RITMO = RESPIRA_PATRONES[0];

// El otro patron de la lista, para el boton que alterna entre los dos.
export const patronSiguiente = (id) =>
  RESPIRA_PATRONES[(RESPIRA_PATRONES.findIndex((p) => p.id === id) + 1) % RESPIRA_PATRONES.length];

/**
 * Copy canonico de "Respira conmigo". Fuente unica para las tres superficies:
 * la seccion del inicio del sitio (Respira.jsx), la pagina /respira
 * (RespiraApp.jsx) y la pestana Respira de la app (respira.jsx). Antes cada una
 * tenia su propio texto y derivaban entre si; al centralizarlo aqui, una sola
 * edicion mueve el sitio en el mismo deploy y la app en el siguiente OTA (este
 * archivo ya viaja en el sync de contenido).
 *
 * Encuadre (verificado): ver el bloque de RESPIRA_PATRONES, donde vive el
 * detalle de cada tecnica.
 *
 * Divulgacion progresiva (C27, ampliada en C41): este texto es el marco comun
 * a los dos patrones y solo dice que hacer (sigue la figura, inhala al
 * expandirse, exhala al recogerse). El detalle de cada ritmo (conteo, via de
 * entrada y salida del aire, cuantos ciclos) vive en el `instruccion` del
 * patron activo, dentro del visor, y aparece justo cuando hace falta. El
 * detalle clinico (nombre de la tecnica, mecanismo, beneficios) se difiere a la
 * pregunta frecuente "Que es Respira conmigo" en faqData.js, para bajar la
 * carga cognitiva en el momento de uso. El verbo "puede ayudar" mantiene la
 * afirmacion honesta; la nota de seguridad deja claro que es apoyo, no
 * tratamiento.
 *
 * CRITICO: cero em-dashes y cero en-dashes.
 */
export const RESPIRA_TEXTO = {
  eyebrow: 'Una pausa para ti',
  titulo: 'Respira conmigo',
  intro:
    'Sigue la figura con tu respiración: inhala mientras se expande y exhala mientras se recoge, a un ritmo lento y suave. Déjate llevar por unos minutos.',
  seguridad:
    'Es un apoyo para relajarte, no un tratamiento. Si sientes mareo o incomodidad, detente y vuelve a tu ritmo natural.',
  puenteTexto: '¿Sientes que necesitas más que una pausa? Podemos trabajarlo juntos en sesión.',
  puenteCta: 'Agendar una sesión',
};

// C31 fix pack 3: azar con semilla opcional. En la web, el servidor (prerender)
// y el cliente (hidratacion) deben producir EXACTAMENTE el mismo arte: si las
// cantidades o coordenadas difieren, React detecta el desajuste (#418), descarta
// el HTML prerenderizado y lo rearma en el cliente. Con semilla numerica la
// secuencia es reproducible; sin semilla (como la usa la app) se conserva el
// azar de siempre.
const crearRnd = (semilla) => {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

let rnd = Math.random;

const alea = (min, max) => min + rnd() * (max - min);
const r1 = (n) => Math.round(n * 10) / 10;
const elegir = (arr) => arr[Math.floor(rnd() * arr.length)];

// Paleta de marca con techo de opacidad por color (seguridad visual).
const PALETA = [
  { fill: '#3F5B4A', op: [0.1, 0.18] },
  { fill: '#A8B5A0', op: [0.16, 0.26] },
  { fill: '#C97B5E', op: [0.1, 0.18] },
  { fill: '#A4583B', op: [0.1, 0.16] },
];

// Radio que el elemento mas extenso besa a inhalacion completa
// (disco r=206, aire de 14 px hasta el anillo).
const RADIO_OBJETIVO = 192;

// Media-hoja asimetrica desde el centro; el espejo la convierte en ala.
function hoja() {
  const largo = alea(116, 158);
  const ancho = alea(10, 26);
  const sesgo = alea(4, 18);
  const x0 = 210;
  const y0 = 210;
  const tx = x0 + sesgo;
  const ty = y0 - largo;
  const d = [
    `M ${x0} ${y0}`,
    `C ${r1(x0 - ancho)} ${r1(y0 - largo * 0.35)},`,
    `${r1(tx - ancho * 0.7)} ${r1(ty + largo * 0.25)},`,
    `${r1(tx)} ${r1(ty)}`,
    `C ${r1(tx + ancho * 0.45)} ${r1(ty + largo * 0.3)},`,
    `${r1(x0 + ancho * 0.55)} ${r1(y0 - largo * 0.3)},`,
    `${x0} ${y0} Z`,
  ].join(' ');
  return { d, ext: Math.hypot(sesgo, largo) };
}

export function generarCaleidoscopio(semilla) {
  rnd = typeof semilla === 'number' ? crearRnd(semilla) : Math.random;
  const hojas = Array.from({ length: elegir([2, 3]) }, () => {
    const c = elegir(PALETA);
    const h = hoja();
    return { ...h, fill: c.fill, op: r1(alea(c.op[0], c.op[1])) };
  });
  const puntos = Array.from({ length: elegir([2, 3]) }, () => {
    const c = elegir(PALETA);
    const cx = r1(210 + alea(-14, 14));
    const cy = r1(210 - alea(72, 150));
    const r = r1(alea(3.5, 8));
    return {
      cx, cy, r,
      ext: Math.hypot(cx - 210, cy - 210) + r,
      fill: c.fill,
      op: r1(alea(0.18, 0.3)),
    };
  });
  const velos = Array.from({ length: 2 }, () => {
    const c = elegir(PALETA);
    const cx = r1(210 + alea(-10, 10));
    const cy = r1(210 - alea(55, 100));
    const rx = r1(alea(26, 48));
    const ry = r1(alea(70, 115));
    return {
      cx, cy, rx, ry,
      ext: Math.hypot(cx - 210, cy - 210) + Math.max(rx, ry),
      rot: r1(alea(-16, 16)),
      fill: c.fill,
      op: r1(alea(0.05, 0.1)),
    };
  });

  // Normalizacion: TODO sorteo besa el mismo radio. Ni figuras perdidas en
  // el disco ni petalos desbordados, para cualquier combinacion aleatoria.
  const extMax = Math.max(
    ...hojas.map((h) => h.ext),
    ...puntos.map((p) => p.ext),
    ...velos.map((v) => v.ext)
  );
  const ajuste = Math.round((RADIO_OBJETIVO / extMax) * 1000) / 1000;

  const dirA = elegir(['normal', 'reverse']);
  return {
    segA: elegir([10, 12, 14]),
    segB: elegir([6, 8]),
    hojas, puntos, velos, ajuste,
    // Periodos lentos y mutuamente inconmensurables.
    durA: Math.round(alea(95, 150)),
    durB: Math.round(alea(160, 230)),
    durC: Math.round(alea(53, 89)),
    durT: Math.round(alea(34, 52)),
    durP: Math.round(alea(31, 47)),
    dirA,
    dirB: dirA === 'normal' ? 'reverse' : 'normal',
    // Fases iniciales aleatorias: ni dos visitas empiezan igual.
    faseA: r1(alea(0, 150)),
    faseB: r1(alea(0, 230)),
    faseC: r1(alea(0, 89)),
    faseT: r1(alea(0, 52)),
    faseP: r1(alea(0, 47)),
    // Apertura maxima de la tijera de alas.
    tdeg: r1(alea(4, 9)),
  };
}
