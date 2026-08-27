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
 * defecto del modal. No hay que tocar nada mas.
 */
export const INGRESO_FONASA_ABIERTO = false;

/**
 * Evento que usan por defecto los CTAs y los modulos de disponibilidad.
 * Derivado, no escrito a mano, para que no exista forma de que una superficie
 * quede anunciando horas de una modalidad que no acepta reservas.
 */
export const EVENTO_PRINCIPAL = INGRESO_FONASA_ABIERTO
  ? 'primeraSesionFonasa'
  : 'particular';
