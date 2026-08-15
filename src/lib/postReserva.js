/**
 * Contenido canonico de la confirmacion post-reserva. Fuente unica que consumen
 * la pagina /cita-agendada del sitio (src/CitaAgendadaApp.jsx) y la pantalla
 * cita-agendada de la app (app/src/app/cita-agendada.jsx). Modulo puro: solo
 * datos y funciones, sin React ni APIs de plataforma, para que las dos
 * superficies lo importen sin friccion (igual que sesiones.js).
 *
 * Estos datos REPLICAN los del correo automatico en netlify/lib/correoReserva.js.
 * Se decidio NO importar este archivo desde la funcion Netlify para no arrastrar
 * src/lib al bundle server-side. Si cambia un dato de pago hay que tocar los dos
 * lugares: este archivo y netlify/lib/correoReserva.js. Cualquier ajuste aqui
 * propaga a sitio y app por las vias normales (build de Vite y sync a la app).
 */
import { PRECIOS } from './precios';
import { PRESTADOR, CONTACTO, URLS_EXTERNAS } from './contacto';

// Pago particular. Mismos valores que el correo automatico.
export const WEBPAY_URL = 'https://www.webpay.cl/form-pay/388212';

// "Cuenta vista" es como BancoEstado clasifica la CuentaRUT. Se explicita porque
// varios bancos piden el tipo de cuenta al cargar un destinatario nuevo y elegir
// "corriente" hace fallar la transferencia. El titular va con nombre legal
// completo: es lo que el banco muestra al validar el destinatario.
export const TRANSFERENCIA = {
  banco: 'BancoEstado',
  tipoCuenta: 'Cuenta RUT (cuenta vista)',
  cuenta: '17520730',
  titular: PRESTADOR.nombreCompleto,
  rut: PRESTADOR.rut,
  correoComprobante: CONTACTO.email,
};

/**
 * Mapeo slug del evento Cal -> codigo Fonasa.
 *
 *   numero:  el codigo tal como lo pide el sistema de Fonasa, sin espacios.
 *   literal: el texto del arancel, identico a la linea que la persona ve en el
 *            listado de Mi Fonasa al elegir la prestacion.
 *
 * Mantener sincronizado con CATALOGO en netlify/lib/correoReserva.js y con
 * CAL_EVENTS en cal.js.
 */
export const FONASA_POR_SLUG = {
  'primera-sesion-bonofonasa': {
    numero: '0908101',
    literal: "09 08 101 Telerehabilitación: Psicólogo clínico (sesiones 45')",
  },
  'sesiones-de-avance-bonofonasa': {
    numero: '0908102',
    literal: '09 08 102 Telerehabilitación: Psicoterapia individual',
  },
  'psicoterapia-de-pareja-bonofonasa': {
    numero: '0908103',
    literal:
      '09 08 103 Telerehabilitación: Sesión de psicoterapia de pareja (con ambos miembros)',
  },
};

export const SLUG_PARTICULAR = 'psicoterapia-individual-online-particular';

// C49: slug anterior del evento particular, de cuando el monto vivia en la
// URL. Sigue habiendo un paciente particular vigente con el enlace viejo, asi
// que este slug debe seguir clasificando como 'particular' indefinidamente.
export const SLUG_PARTICULAR_LEGACY = 'psicoterapia-individual-online-particular-15.000';

/**
 * Clasifica un slug de Cal en 'fonasa', 'particular' o null (desconocido).
 * Tolerante: si el slug no calza con ninguno, devuelve null y la interfaz
 * muestra ambas vias de pago como respaldo (degradacion segura).
 */
export function tipoDeReserva(slug) {
  if (!slug) return null;
  if (FONASA_POR_SLUG[slug]) return 'fonasa';
  if (slug === SLUG_PARTICULAR || slug === SLUG_PARTICULAR_LEGACY) return 'particular';
  return null;
}

// Codigo Fonasa para un slug ({ numero, literal }), o null si no aplica.
export function codigoFonasaDeSlug(slug) {
  return FONASA_POR_SLUG[slug] || null;
}

/**
 * Bloque de pago Fonasa, listo para pintar. Si el slug calza, su codigo va en el
 * paso del listado; si no, ese paso queda generico ("el codigo que corresponde a
 * tu sesion") para no afirmar un codigo incorrecto.
 *
 * Los pasos incluyen region y comuna porque el formulario de Mi Fonasa las pide
 * para emitir el bono. La atencion es online y eso se aclara en el mismo texto,
 * para que nadie entienda que tiene que ir a Valparaiso.
 */
export function pasosFonasa(slug) {
  const codigo = codigoFonasaDeSlug(slug);
  return {
    titulo: 'Paga tu sesión (bono Fonasa)',
    intro: 'Antes de la sesión necesitas comprar el bono Fonasa:',
    pasos: [
      'Entra a Mi Fonasa con tu ClaveÚnica y abre la compra de bono en línea.',
      `Busca al prestador por RUT: ${PRESTADOR.rut} (${PRESTADOR.nombreCompleto}).`,
      `Si el sistema pide ubicación, indica ${PRESTADOR.regionBono}, comuna ${PRESTADOR.comunaBono}. La atención es online: esos datos son solo los que Fonasa exige para emitir el bono.`,
      codigo
        ? `Selecciona el código de prestación ${codigo.numero}. En el listado aparece como: ${codigo.literal}`
        : 'Selecciona el código de prestación que corresponde a tu sesión.',
      `Paga el copago de ${PRECIOS.fonasaCopago.display} (tramos B, C y D) y descarga el bono con su folio.`,
      `Envíame el folio por WhatsApp (${CONTACTO.whatsappDisplay}) antes de la sesión, sin excepción. Sin el folio no puedo registrar la prestación en Fonasa.`,
    ],
    enlace: { texto: 'Ir a Mi Fonasa', url: URLS_EXTERNAS.miFonasa },
  };
}

// Bloque de pago particular, listo para pintar. A diferencia del bono Fonasa,
// que se compra antes, la sesion particular se paga DESPUES de la sesion.
export function pasosParticular() {
  return {
    // Titulo en indicativo y no en imperativo ("Paga tu sesion"), porque aqui no
    // hay nada que hacer antes de la hora: es informacion para despues. Mismo
    // encuadre que el correo automatico.
    titulo: `Cómo se paga tu sesión particular (${PRECIOS.particular.display})`,
    intro:
      'La sesión particular se paga después de la sesión, por transferencia electrónica:',
    transferencia: TRANSFERENCIA,
    nota: `Envíame el comprobante a ${CONTACTO.email} o por WhatsApp (${CONTACTO.whatsappDisplay}).`,
    webpay: { texto: 'Pagar con WebPay', url: WEBPAY_URL },
    notaWebpay: 'Si prefieres pagar con tarjeta, también puedes hacerlo por WebPay.',
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
