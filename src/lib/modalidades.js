/**
 * Interruptores comerciales del sitio. C54: son DOS, y son independientes.
 *
 *   INGRESO_FONASA_ABIERTO  si el ingreso Fonasa acepta reservas nuevas.
 *   HERO_MODO               que cara muestra el sitio, 'particular' o 'fonasa',
 *                           segun cual de las dos campanas de Google Ads este
 *                           corriendo. Nunca corren las dos a la vez.
 *
 * Los dos se leen de estadoIngreso.js, que scripts/estado-ingreso.mjs
 * sobrescribe en cada build con lo que dice la hoja Sitio web de la Planilla.
 * Que sean independientes es a proposito: HERO_MODO 'fonasa' con
 * INGRESO_FONASA_ABIERTO false es un estado valido y es exactamente como estaba
 * el sitio antes de C52 (el hero habla de Fonasa y la tarjeta dice sin cupos).
 *
 * C52: el ingreso Fonasa se cierra. La agenda esta saturada de horas fijas
 * Fonasa y los cupos de ingreso quedaron limitados a uno al mes dentro de
 * Cal.com, asi que ofrecerlos en el sitio manda gente a una espera larga sin
 * decirselo. La atencion Fonasa NO desaparece: los pacientes actuales siguen
 * en tratamiento, el contenido explicativo se queda y los correos del webhook
 * conservan todas sus variantes Fonasa.
 *
 * POR QUE VIVE ACA Y NO EN cal.js: cal.js es el mapa de slugs de Cal.com,
 * infraestructura. Esto es politica comercial. Mezclarlas le daria al archivo
 * dos razones distintas para cambiar.
 *
 * DIRECCION SEGURA DEL FALLO: el valor compilado es el PISO. Mostrar "hay
 * cupos" cuando no los hay manda gente a una pagina muerta y quema confianza;
 * mostrar "sin cupos" cuando si los hay solo pierde una reserva. El costo no
 * es simetrico. La lectura externa solo puede ABRIR, nunca cerrar por su
 * cuenta, y un fallo de lectura deja los valores versionados de
 * estadoIngreso.js: false y 'particular'. Es la misma cascada del Limitador de
 * Agenda, que nunca devuelve "sin tope".
 *
 * PARA REABRIR FONASA: son TRES pasos y solo el primero lo hace el codigo.
 *   1. Poner en TRUE la celda de la Planilla, hoja Sitio web, la fila cuya
 *      etiqueta en la columna A es "Ingreso Fonasa abierto". El disparador
 *      onEdit llama al build hook de Netlify y el sitio se reconstruye solo en
 *      unos dos minutos. Eso propaga a la tarjeta de Precios, al CTA primario,
 *      a los tres modulos de disponibilidad (hero, seccion y barra de movil),
 *      al mensaje de WhatsApp y a la pestana por defecto del modal.
 *   2. Entrar a app.cal.com/event-types y quitar el oculto a
 *      'primera-sesion-bonofonasa' y 'psicoterapia-de-pareja-bonofonasa'. C53:
 *      el 29 de agosto de 2026 se descubrio que los dos seguian PUBLICOS y
 *      aceptando reservas Fonasa mientras el sitio declaraba el ingreso
 *      cerrado. Este interruptor solo controla lo que el sitio DICE, nunca lo
 *      que Cal.com ACEPTA. Si se salta este paso la reserva igual funciona (un
 *      evento oculto acepta reservas por embed y por URL directa) pero el
 *      evento no reaparece en la pagina publica de Cal.com.
 *   3. Publicar una OTA de la app. La app NO corre el prebuild del sitio: su
 *      postinstall solo copia archivos, asi que se queda con el false
 *      versionado de estadoIngreso.js hasta que alguien reconstruya. Falla en
 *      la direccion segura, la app ofrece de menos y nunca de mas, pero diverge
 *      del sitio en silencio.
 *
 * PARA CAMBIAR LA CARA DEL SITIO: la celda "Modo del hero" de la misma hoja,
 * con 'particular' o 'fonasa'. Un solo cambio de celda, sin commit.
 */
export { INGRESO_FONASA_ABIERTO_PLANILLA as INGRESO_FONASA_ABIERTO } from './estadoIngreso';
export { HERO_MODO_PLANILLA as HERO_MODO } from './estadoIngreso';

import { INGRESO_FONASA_ABIERTO_PLANILLA, HERO_MODO_PLANILLA } from './estadoIngreso';

/**
 * Evento que usan por defecto los CTAs y los modulos de disponibilidad.
 * Derivado, no escrito a mano, para que no exista forma de que una superficie
 * quede anunciando horas de una modalidad que no acepta reservas.
 *
 * Depende del ingreso, NO del modo del hero: el modo decide de que se habla,
 * el ingreso decide que se puede reservar. Un hero en modo Fonasa con el
 * ingreso cerrado tiene que seguir mandando el CTA al particular.
 */
export const EVENTO_PRINCIPAL = INGRESO_FONASA_ABIERTO_PLANILLA
  ? 'primeraSesionFonasa'
  : 'particular';

/**
 * Si la OFERTA Fonasa (copago, codigos de prestacion MLE, tarjetas de precio)
 * ocupa lugar en el sitio. Lo decide el modo del hero, no el ingreso: en modo
 * particular esos datos confunden a quien llega por un anuncio de sesion
 * particular, y el copago es lo primero que hace pensar que se puede usar el
 * bono. Lo que NO depende de esto: la certificacion de la plataforma por
 * Fonasa y la inscripcion del prestador en MLE, que son senales de confianza
 * validas para todos y se quedan en los dos modos.
 */
export const OFERTA_FONASA_VISIBLE = HERO_MODO_PLANILLA === 'fonasa';
