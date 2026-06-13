/**
 * Copy canonico del hero. Fuente unica consumida por el sitio (Hero.jsx) y por
 * la app (pantalla Inicio). La rotacion de frases del H1, los CTAs, la
 * microcopia de precios y los chips de confianza viven SOLO aqui: editar este
 * archivo mueve el sitio en el mismo deploy y la app en el siguiente OTA.
 */
import { PRECIOS } from './precios';

export const HERO = {
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
  sub: 'Trabajemos lo que hoy te limita y dale un nuevo sentido a lo que vives. Sesiones de 45 minutos por videollamada segura, con bono Fonasa o particular.',
  ctaPrimario: 'Agendar tu sesión',
  ctaSecundario: 'Conversemos por WhatsApp',
  mensajeWhatsApp: 'Hola Juan, vi tu sitio y me gustaría conversar sobre una primera sesión.',
  microcopia: `Primera sesión con bono Fonasa: copago ${PRECIOS.fonasaCopago.display}.`,
  enlaceParticular: `¿Sin Fonasa? Ver sesión particular (${PRECIOS.particular.display}) →`,
  chips: ['Psicólogo clínico', 'Inscrito en Fonasa', 'Videollamada cifrada'],
};
