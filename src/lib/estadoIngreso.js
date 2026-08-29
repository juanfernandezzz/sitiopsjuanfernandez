/**
 * ARCHIVO GENERADO. No lo edites a mano esperando que el cambio sobreviva.
 *
 * QUE ES
 * El estado del ingreso Fonasa que Juan escribe en la hoja Configuracion de la
 * Planilla de horas agendadas. Lo lee scripts/estado-ingreso.mjs justo antes de
 * que corra Vite, y sobrescribe este archivo con el valor de la Planilla.
 *
 * POR QUE ESTA VERSIONADO SI ES GENERADO
 * Porque su valor en git ES el comportamiento por defecto, no un placeholder.
 * Si la Planilla no responde durante un build, el script no escribe nada y el
 * build usa lo que dice aca. Por eso en git este valor tiene que ser SIEMPRE
 * false, y nunca se commitea en true: es lo que garantiza que un fallo de
 * lectura cierre Fonasa en vez de abrirlo.
 *
 * DIRECCION DEL FALLO
 * La lectura externa solo puede ABRIR. Nunca cierra por su cuenta, porque el
 * cierre ya es el valor de partida. Es la misma cascada del Limitador de
 * Agenda, que nunca devuelve "sin tope".
 *
 * En un checkout limpio este archivo dice false y el sitio se comporta como si
 * la Planilla no existiera. Eso es correcto y es a proposito.
 */
export const INGRESO_FONASA_ABIERTO_PLANILLA = false;
