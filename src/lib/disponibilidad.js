/**
 * Disponibilidad en vivo: lógica pura compartida por el sitio y por la app.
 *
 * POR QUE ESTE ARCHIVO NO TOCA EL DOM NI fetch
 *   src/lib/ se sincroniza hacia la app por postinstall. Todo lo que viva aquí
 *   tiene que ser importable desde React Native sin adaptadores. La llamada de
 *   red vive en el componente; aquí solo hay datos y funciones puras.
 *
 * POR QUE UNA MAQUINA DE ESTADOS Y NO UN DATO PLANO
 *   Un indicador que solo imprime la próxima fecha es un arma de doble filo: si
 *   la fecha está cerca convierte, y si está lejos publica "no hay horas" en el
 *   hero de todas las páginas. Los tres estados separan esos dos mundos y dejan
 *   un tercero para cuando el dato no es confiable, donde lo correcto es no
 *   decir nada en vez de mostrar un esqueleto roto.
 */

// Umbral entre "cercano" y "lejano", en días. Cambiar aquí propaga a todas las
// superficies. 7 días es la tolerancia estimada del paciente que busca hora;
// el objetivo operativo de Juan es más estricto (4 días) y vive en ALERTA_DIAS.
export const UMBRAL_CERCANO_DIAS = 7;

// Umbral de alerta interna: por encima de esto la función de disponibilidad
// marca `alerta: true` para que quede registrado que la agenda se estiró.
export const ALERTA_DIAS = 4;

// Cupos de ingreso reservados por semana. ESTE NUMERO DEBE COINCIDIR con el
// límite semanal configurado en Cal.com para el evento de primera sesión
// (evento 5776252, pestaña Límites y espacios, "Limitar frecuencia de
// reservas"). El particular (evento 5785503) lleva su propia cuota, hoy en 3.
// Para expandir a 3 o 4: cambia el número aquí y en Cal.com, nada más.
//
// C50: baja de 3 a 2. La cartera vigente ocupa casi toda la capacidad y los
// cupos de ingreso salen de la rotación real, no de inventario libre.
export const CUPOS_INGRESO_SEMANALES = 2;

// Capacidad real semanal según los topes del limitador (Apps Script):
// lunes 5, martes 4, miércoles 4, jueves 4, viernes 6, sábado 3.
export const CUPOS_SEMANALES_TOTALES = 26;

// Texto de escasez. Es un hecho estructural verificable, no urgencia fabricada:
// se deriva de los topes reales del limitador.
export const AVISO_CUPOS_LIMITADOS = `Cupos limitados: ${CUPOS_SEMANALES_TOTALES} sesiones por semana`;

export const ESTADOS = {
  CERCANO: 'cercano',
  LEJANO: 'lejano',
  DESCONOCIDO: 'desconocido',
};

const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Parte una fecha ISO de solo día ("2026-08-25") en sus componentes sin pasar
 * por el constructor Date con string, que interpreta ese formato como UTC y
 * puede correr el día completo hacia atrás en zonas al oeste de Greenwich.
 * Chile está en UTC-4 o UTC-3: el bug sería visible todos los días.
 */
function partesDeFecha(iso) {
  if (typeof iso !== 'string') return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  // Mediodía local: inmuniza el cálculo del día de la semana contra cambios de
  // horario de verano, que en Chile mueven el reloj a medianoche.
  const d = new Date(anio, mes - 1, dia, 12, 0, 0);
  return { anio, mes, dia, fecha: d, diaSemana: d.getDay() };
}

/** "martes 25" para el mensaje de WhatsApp y para la píldora compacta. */
export function fechaCorta(iso) {
  const p = partesDeFecha(iso);
  if (!p) return null;
  return `${DIAS_SEMANA[p.diaSemana]} ${p.dia}`;
}

/** "martes 25 de agosto" para el módulo completo. */
export function fechaLarga(iso) {
  const p = partesDeFecha(iso);
  if (!p) return null;
  return `${DIAS_SEMANA[p.diaSemana]} ${p.dia} de ${MESES[p.mes - 1]}`;
}

/** Estado a partir de la distancia en días. */
export function estadoPorDias(diasHasta) {
  if (typeof diasHasta !== 'number' || Number.isNaN(diasHasta)) {
    return ESTADOS.DESCONOCIDO;
  }
  return diasHasta <= UMBRAL_CERCANO_DIAS ? ESTADOS.CERCANO : ESTADOS.LEJANO;
}

/**
 * Normaliza la respuesta cruda de la función de Netlify a algo que el
 * componente pueda pintar sin ramificar. Si algo no calza, devuelve estado
 * DESCONOCIDO: preferimos no decir nada antes que decir algo falso.
 */
export function normalizar(payload, claveEvento) {
  if (!payload || !payload.eventos) {
    return { estado: ESTADOS.DESCONOCIDO };
  }
  const e = payload.eventos[claveEvento];
  if (!e || !e.fechaISO || !Array.isArray(e.horas) || e.horas.length === 0) {
    return { estado: ESTADOS.DESCONOCIDO };
  }
  const estado = estadoPorDias(e.diasHasta);
  if (estado === ESTADOS.DESCONOCIDO) return { estado };
  return {
    estado,
    fechaISO: e.fechaISO,
    corta: fechaCorta(e.fechaISO),
    larga: fechaLarga(e.fechaISO),
    horas: e.horas,
    diasHasta: e.diasHasta,
    cuposSemana: typeof e.cuposSemana === 'number' ? e.cuposSemana : null,
  };
}

/**
 * Mensaje prellenado de WhatsApp. La fecha es la real devuelta por Cal.com, no
 * un texto fijo: si no hay fecha confiable, el mensaje cae a una versión sin
 * fecha en vez de inventar una.
 *
 * `sesion` describe el tipo en lenguaje de paciente, no el slug.
 *
 * C51: aquí se pasa la fecha LARGA ("martes 1 de septiembre"), no la corta.
 * La píldora del sitio puede permitirse "martes 1" porque el mes se infiere del
 * contexto visual; un mensaje de WhatsApp viaja solo, se lee días después y
 * cruza el cambio de mes con frecuencia (la primera sesión suele estar a más de
 * una semana). "martes 1" a secas es ambiguo justo cuando más importa.
 */
export function mensajeWhatsApp(fechaTexto, sesion = 'una primera sesión') {
  if (!fechaTexto) {
    return `Hola Juan, quisiera hablar sobre ${sesion}.`;
  }
  return `Hola Juan, vi que tu próxima hora disponible es el ${fechaTexto}, y quisiera hablar sobre ${sesion}.`;
}

/** URL de WhatsApp lista para usar. El número va sin el signo inicial. */
export function urlWhatsApp(numero, texto) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
