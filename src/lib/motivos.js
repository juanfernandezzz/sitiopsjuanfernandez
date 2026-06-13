/**
 * Motivos de consulta en lenguaje del paciente. Fuente unica consumida por el
 * sitio (seccion MotivosConsulta) y por la app (pantalla Inicio), para que la
 * lista no derive entre superficies.
 *
 * Decision CRO: reconocimiento en 5 segundos. El visitante se identifica con un
 * motivo en su propio lenguaje antes de procesar la metodologia (TCC y
 * narrativa), que queda como respaldo y no como gancho.
 */
export const MOTIVOS = ['Ansiedad', 'Depresión', 'Relaciones', 'Duelo', 'Estrés'];
