/**
 * Las cuatro sesiones agendables. Fuente unica consumida por el sitio
 * (ModalTipoSesion) y por la app (pantalla Agendar). key es el NOMBRE de la
 * propiedad en CAL_EVENTS (cal.js), nunca el slug directo.
 *
 * Campos por superficie: el modal usa titulo + detalleModal (incluye el copago
 * en el punto de decision); la app usa titulo + precio + detalleApp + cta.
 * Ambas leen destacada.
 */
import { PRECIOS } from './precios';

export const SESIONES = [
  {
    key: 'primeraSesionFonasa',
    titulo: 'Primera sesión con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalleModal: `Si es tu primera vez conmigo. Copago ${PRECIOS.fonasaCopago.display}.`,
    detalleApp: 'Si es tu primera vez conmigo. Conversamos y entendemos juntos qué te trae.',
    destacada: true,
    cta: 'Agendar primera sesión',
  },
  {
    key: 'controlAvanceFonasa',
    titulo: 'Sesión de avance con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalleModal: `Si ya iniciaste tratamiento conmigo. Copago ${PRECIOS.fonasaCopago.display}.`,
    detalleApp: 'Si ya iniciaste tratamiento conmigo.',
    cta: 'Agendar sesión de avance',
  },
  {
    key: 'parejaFonasa',
    titulo: 'Sesión de pareja con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalleModal: `Con ambos miembros presentes. Copago ${PRECIOS.fonasaCopago.display}.`,
    detalleApp: 'Con ambos miembros presentes.',
    cta: 'Agendar sesión de pareja',
  },
  {
    key: 'particular15000',
    titulo: 'Sesión particular',
    precio: PRECIOS.particular.display,
    detalleModal: `Sin previsión requerida. ${PRECIOS.particular.display}.`,
    detalleApp: 'Sin previsión requerida. Comprobante para reembolso de Isapre cuando aplique.',
    cta: 'Agendar sesión particular',
  },
];
