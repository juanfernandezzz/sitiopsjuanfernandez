/**
 * ARCHIVO GENERADO. No lo edites a mano esperando que el cambio sobreviva.
 *
 * QUE ES
 * Los dos interruptores que Juan escribe en la hoja Sitio web de la Planilla de
 * horas agendadas. Los lee scripts/estado-ingreso.mjs justo antes de que corra
 * Vite, y sobrescribe este archivo con los valores de la Planilla.
 *
 *   INGRESO_FONASA_ABIERTO_PLANILLA  si el ingreso Fonasa acepta reservas.
 *   HERO_MODO_PLANILLA               que cara muestra el sitio: 'particular' o
 *                                    'fonasa'. Es la campana de Google Ads que
 *                                    esta corriendo, nunca las dos a la vez.
 *
 * SON INDEPENDIENTES A PROPOSITO
 * heroModo 'fonasa' con ingresoFonasaAbierto false es un estado valido, y es
 * exactamente como estaba el sitio antes de C52: el hero habla de Fonasa y la
 * tarjeta dice que no hay cupos.
 *
 * POR QUE ESTA VERSIONADO SI ES GENERADO
 * Porque su valor en git ES el comportamiento por defecto, no un placeholder.
 * Si la Planilla no responde durante un build, el script no escribe nada y el
 * build usa lo que dice aca. Por eso en git estos valores tienen que ser
 * SIEMPRE false y 'particular', y nunca se commitea otra cosa: es lo que
 * garantiza que un fallo de lectura cierre Fonasa en vez de abrirlo, y que deje
 * el sitio en la cara que hoy corresponde a la unica agenda abierta.
 *
 * DIRECCION DEL FALLO
 * La lectura externa solo puede ABRIR. Nunca cierra por su cuenta, porque el
 * cierre ya es el valor de partida. Es la misma cascada del Limitador de
 * Agenda, que nunca devuelve "sin tope".
 *
 * En un checkout limpio este archivo dice false y 'particular', y el sitio se
 * comporta como si la Planilla no existiera. Eso es correcto y es a proposito.
 */
export const INGRESO_FONASA_ABIERTO_PLANILLA = false;
export const HERO_MODO_PLANILLA = 'particular';
