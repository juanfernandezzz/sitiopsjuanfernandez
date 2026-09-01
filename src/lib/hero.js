/**
 * Copy canonico del hero. Fuente unica consumida por el sitio (Hero.jsx) y por
 * la app (pantalla Inicio). La rotacion de frases del H1, los CTAs, la
 * microcopia de precios y los chips de confianza viven SOLO aqui: editar este
 * archivo mueve el sitio en el mismo deploy y la app en el siguiente OTA.
 *
 * C54: el hero es conmutable. Hay dos variantes completas y HERO_MODO decide
 * cual se exporta como HERO. Los componentes consumen HERO y nunca preguntan
 * por el modo: la variante se resuelve aca, en tiempo de build, asi que el HTML
 * prerenderizado ya sale con una sola cara y no hay nada que decidir en el
 * navegador.
 *
 *   particular  la campana de sesion particular. Es la cara por defecto y la
 *               que queda si la Planilla no responde.
 *   fonasa      la campana de bono Fonasa. Recupera el orden anterior a C52:
 *               Fonasa primero, particular como ruta alternativa.
 *
 * El modo NO dice si hay cupos. Eso lo decide INGRESO_FONASA_ABIERTO, que es
 * otro interruptor: el hero puede hablar de Fonasa mientras la tarjeta de
 * Precios muestra "sin cupos".
 */
import { PRECIOS } from './precios';
import { HERO_MODO } from './modalidades';

// Lo que no cambia entre campanas: identidad, ritmo del H1 y CTAs. Si algo de
// aca empieza a variar por modo, se muda a las variantes de abajo.
const COMUN = {
  eyebrow: 'Terapia online en Chile',
  // El H1 es una linea fija mas una frase rotativa.
  lineaFija: 'Terapia psicológica online,',
  rotativas: [
    'un espacio donde eres protagonista',
    'sin salir de casa, a tu propio ritmo',
    'acompañamiento sin prejuicios',
  ],
  // La mas larga reserva la altura del bloque (CLS 0 en web; mismo truco en app).
  rotativaMasLarga: 'sin salir de casa, a tu propio ritmo',
  rotacionMs: 4500,
  salidaMs: 300,
  ctaPrimario: 'Agendar tu sesión',
  ctaSecundario: 'Conversemos por WhatsApp',
  mensajeWhatsApp: 'Hola Juan, vi tu sitio y me gustaría conversar sobre una primera sesión.',
  // C54: el chip "Inscrito en Fonasa" se queda en los dos modos. Es una
  // credencial verificable del prestador, no una oferta.
  chips: ['Psicólogo clínico', 'Inscrito en Fonasa', 'Videollamada cifrada'],
};

/**
 * Modo particular. C52: la microcopia dejo de anunciar el copago Fonasa, y este
 * parrafo es el dato que queda sobre el pliegue en movil. C54: sin ruta
 * alternativa hacia Fonasa, porque en esta campana no hay nada que ofrecer del
 * otro lado y el enlace solo mandaba a mirar una tarjeta sin cupos.
 */
export const HERO_PARTICULAR = {
  ...COMUN,
  sub: 'Trabajemos lo que hoy te limita y dale un nuevo sentido a lo que vives. Sesiones de 45 minutos por videollamada segura.',
  microcopia: `Sesión particular: ${PRECIOS.particular.display}.`,
  lineaPago: 'Pagas por transferencia o WebPay, después de la sesión',
  enlaceSecundario: null,
};

/**
 * Modo Fonasa. Fonasa primero, particular despues, como antes de C52. La ruta
 * alternativa vuelve a apuntar a quien NO tiene Fonasa, y lleva a la seccion de
 * precios (ancla real de la pagina), no a Cal.com.
 */
export const HERO_FONASA = {
  ...COMUN,
  sub: 'Trabajemos lo que hoy te limita y dale un nuevo sentido a lo que vives. Sesiones de 45 minutos por videollamada segura, con bono Fonasa o particular.',
  microcopia: `Primera sesión con bono Fonasa: copago ${PRECIOS.fonasaCopago.display}, y el bono lo compras antes de la sesión. Sesión particular: ${PRECIOS.particular.display}.`,
  lineaPago: 'Pagas por transferencia o WebPay, después de la sesión',
  enlaceSecundario: {
    texto: `¿Sin Fonasa? Mira la sesión particular (${PRECIOS.particular.display}) →`,
    href: '#precios',
  },
};

export const HERO = HERO_MODO === 'fonasa' ? HERO_FONASA : HERO_PARTICULAR;
