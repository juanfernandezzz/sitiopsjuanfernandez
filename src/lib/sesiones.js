/**
 * Las cuatro sesiones agendables. Fuente unica consumida por el sitio
 * (ModalTipoSesion, HeaderAgendarMenu) y por la app (pantalla Agendar). key es
 * el NOMBRE de la propiedad en CAL_EVENTS (cal.js), nunca el slug directo.
 *
 * C36: campo `detalle` unificado (antes detalleModal web y detalleApp app). El
 * precio NO vive en el texto: cada superficie renderiza `precio` como dato
 * estructurado junto al titulo, asi el monto sale siempre de PRECIOS y el copy
 * no puede derivar entre superficies.
 */
import { PRECIOS } from './precios';

export const SESIONES = [
  {
    key: 'primeraSesionFonasa',
    titulo: 'Primera sesión con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalle: 'Si es tu primera vez conmigo. Conversamos y entendemos juntos qué te trae.',
    destacada: true,
    cta: 'Agendar primera sesión',
  },
  {
    key: 'controlAvanceFonasa',
    titulo: 'Sesión de avance con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalle: 'Si ya iniciaste tratamiento conmigo.',
    cta: 'Agendar sesión de avance',
  },
  {
    key: 'parejaFonasa',
    titulo: 'Sesión de pareja con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalle: 'Con ambos miembros presentes.',
    cta: 'Agendar sesión de pareja',
  },
  {
    key: 'particular15000',
    titulo: 'Sesión particular',
    precio: PRECIOS.particular.display,
    detalle: 'Si tienes Isapre, otra previsión o ninguna. Boleta de honorarios para solicitar reembolso según tu plan.',
    cta: 'Agendar sesión particular',
  },
];
