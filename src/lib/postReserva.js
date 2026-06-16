/**
 * Contenido canonico de la confirmacion post-reserva. Fuente unica que consumen
 * la pagina /cita-agendada del sitio (src/CitaAgendadaApp.jsx) y la pantalla
 * cita-agendada de la app (app/src/app/cita-agendada.jsx). Modulo puro: solo
 * datos y funciones, sin React ni APIs de plataforma, para que las dos
 * superficies lo importen sin friccion (igual que sesiones.js).
 *
 * Estos datos REPLICAN los del correo automatico en netlify/functions/cal-webhook.js.
 * Se decidio NO importar este archivo desde la funcion Netlify para no arrastrar
 * src/lib al bundle server-side de una funcion ya estable y probada; el webhook
 * mantiene su propia copia hardcodeada. Si cambia un dato de pago, hay que
 * tocar los dos lugares: este archivo y cal-webhook.js. Cualquier ajuste aqui
 * propaga a sitio y app por las vias normales (build de Vite y sync a la app).
 */
import { PRECIOS } from './precios';
import { PRESTADOR, CONTACTO, URLS_EXTERNAS } from './contacto';

// Pago particular. Mismos valores que el correo automatico.
export const WEBPAY_URL = 'https://www.webpay.cl/form-pay/388212';

export const TRANSFERENCIA = {
  banco: 'BancoEstado (CuentaRUT)',
  cuenta: '17520730',
  titular: PRESTADOR.nombre,
  rut: PRESTADOR.rut,
  correoComprobante: CONTACTO.email,
};

/**
 * Mapeo slug del evento Cal -> codigo Fonasa con su string LITERAL del portal,
 * identico a lo que la persona ve en Mi Fonasa al comprar el bono. Mantener
 * sincronizado con FONASA_POR_SLUG en cal-webhook.js y con CAL_EVENTS en cal.js.
 */
export const FONASA_POR_SLUG = {
  'primera-sesion-bonofonasa':
    "09 08 101 Telerehabilitación: Psicólogo clínico (sesiones 45')",
  'sesiones-de-avance-bonofonasa':
    '09 08 102 Telerehabilitación: Psicoterapia individual',
  'psicoterapia-de-pareja-bonofonasa':
    '09 08 103 Telerehabilitación: Sesión de psicoterapia de pareja (con ambos miembros)',
};

export const SLUG_PARTICULAR = 'psicoterapia-individual-online-particular-15.000';

/**
 * Clasifica un slug de Cal en 'fonasa', 'particular' o null (desconocido).
 * Tolerante: si el slug no calza con ninguno, devuelve null y la interfaz
 * muestra ambas vias de pago como respaldo (degradacion segura).
 */
export function tipoDeReserva(slug) {
  if (!slug) return null;
  if (FONASA_POR_SLUG[slug]) return 'fonasa';
  if (slug === SLUG_PARTICULAR) return 'particular';
  return null;
}

// Codigo Fonasa literal para un slug, o null si no aplica.
export function codigoFonasaDeSlug(slug) {
  return FONASA_POR_SLUG[slug] || null;
}

/**
 * Bloque de pago Fonasa, listo para pintar. Si el slug calza, su codigo va en
 * el paso 3; si no, el paso 3 queda generico ("el codigo que corresponde a tu
 * sesion") para no afirmar un codigo incorrecto.
 */
export function pasosFonasa(slug) {
  const codigo = codigoFonasaDeSlug(slug);
  return {
    titulo: 'Paga tu sesión (bono Fonasa)',
    intro: 'Antes de la sesión necesitas comprar el bono Fonasa:',
    pasos: [
      'Entra a Mi Fonasa con tu ClaveÚnica.',
      `Busca el prestador por RUT: ${PRESTADOR.rut} (${PRESTADOR.nombre}).`,
      codigo
        ? `Selecciona el código: ${codigo}`
        : 'Selecciona el código que corresponde a tu sesión.',
      `Paga el bono (copago ${PRECIOS.fonasaCopago.display} para tramos B, C y D) y recibirás un folio.`,
      `Envíame el folio por WhatsApp (${CONTACTO.whatsappDisplay}) antes de la sesión. Sin el folio no puedo registrar la prestación en Fonasa.`,
    ],
    enlace: { texto: 'Ir a Mi Fonasa', url: URLS_EXTERNAS.miFonasa },
  };
}

// Bloque de pago particular, listo para pintar.
export function pasosParticular() {
  return {
    titulo: `Paga tu sesión (particular, ${PRECIOS.particular.display})`,
    intro: 'Puedes pagar de dos formas antes de la sesión:',
    webpay: { texto: 'Pagar con WebPay', url: WEBPAY_URL },
    transferencia: TRANSFERENCIA,
    nota: `Envíame el comprobante a ${CONTACTO.email} o por WhatsApp (${CONTACTO.whatsappDisplay}).`,
  };
}

// Paso de consentimiento informado (requisito legal, va primero en el flujo).
export const CONSENTIMIENTO = {
  titulo: 'Completa el consentimiento informado',
  texto:
    'Es un requisito legal (Ley 21.541 de Telemedicina) y toma unos 4 minutos. Recibirás una copia firmada en tu correo y la podrás descargar en PDF.',
  ctaTexto: 'Completar consentimiento',
  // Ruta relativa: en el sitio resuelve al documento real; en la app este enlace
  // se abre en el navegador del sistema con el dominio completo (ver pantalla).
  ruta: '/consentimiento.html',
};

// Llegada a la videollamada. Encuadre Doxy obligatorio: certificada por Fonasa.
export const LLEGADA = {
  titulo: 'Cómo entras a la sesión',
  texto:
    'El día de tu hora entras a la videollamada desde el navegador, sin descargar nada. La consulta usa Doxy.me, plataforma certificada por Fonasa.',
  ctaTexto: 'Sala de espera (Doxy.me)',
  url: CONTACTO.doxyUrl,
};

// Texto de cabecera de la confirmacion (mismo en sitio y app).
export const CONFIRMACION = {
  titulo: 'Reserva confirmada',
  bajada:
    'Te llegará un correo con la confirmación y estos mismos pasos. Si en unos minutos no aparece, revisa la carpeta de spam o promociones.',
};
