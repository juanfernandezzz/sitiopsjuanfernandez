/**
 * Interruptor comercial del sitio. Un solo archivo, un solo booleano.
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
 * es simetrico. Cuando en C54 este dato llegue desde la planilla, la lectura
 * externa solo podra ABRIR, nunca cerrar por su cuenta, y un fallo de lectura
 * deja el valor de aca. Es la misma cascada del Limitador de Agenda, que nunca
 * devuelve "sin tope".
 *
 * PARA REABRIR FONASA: cambiar false por true y desplegar. Eso propaga a la
 * tarjeta de Precios, al CTA primario, a los tres modulos de disponibilidad
 * (hero, seccion y barra de movil), al mensaje de WhatsApp y a la pestana por
 * defecto del modal.
 *
 * C53: el valor dejo de estar escrito aca. Se lee de estadoIngreso.js, que
 * scripts/estado-ingreso.mjs sobrescribe en cada build con lo que dice la hoja
 * Configuracion de la Planilla. La cascada de arriba se cumple igual, porque el
 * valor versionado de ese archivo es false: un fallo de lectura no cierra nada,
 * deja el cierre que ya estaba. Lo que se adelanto de C54 a C53 es solo de
 * donde viene el dato, no la direccion del fallo.
 *
 * PARA REABRIR FONASA: son TRES pasos y solo el primero lo hace el codigo.
 *   1. Poner en TRUE la celda de la Planilla, hoja Configuracion, la fila cuya
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
 */
export { INGRESO_FONASA_ABIERTO_PLANILLA as INGRESO_FONASA_ABIERTO } from './estadoIngreso';

import { INGRESO_FONASA_ABIERTO_PLANILLA } from './estadoIngreso';

/**
 * Evento que usan por defecto los CTAs y los modulos de disponibilidad.
 * Derivado, no escrito a mano, para que no exista forma de que una superficie
 * quede anunciando horas de una modalidad que no acepta reservas.
 */
export const EVENTO_PRINCIPAL = INGRESO_FONASA_ABIERTO_PLANILLA
  ? 'primeraSesionFonasa'
  : 'particular';
