import { Resend } from 'resend';
import crypto from 'crypto';

/**
 * Webhook que Cal.com llama tras BOOKING_CREATED.
 *
 * Flujo:
 *   1. Valida la firma HMAC-SHA-256 del payload con CAL_WEBHOOK_SECRET.
 *   2. Extrae nombre y email del attendee.
 *   3. Envía email al paciente con link pre-rellenado al consentimiento.
 *
 * Variables de entorno requeridas:
 *   - CAL_WEBHOOK_SECRET   (string aleatorio, mismo configurado en Cal.com)
 *   - RESEND_API_KEY
 *   - EMAIL_FROM_AUTOMATICO
 *   - EMAIL_REPLY_TO
 *   - SITIO_URL            (default: https://psicologojuanfernandez.cl)
 *
 * Retorna 200 incluso ante errores no críticos para evitar reintentos de Cal.com
 * que solo generarían ruido sin resolver el problema raíz.
 */

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CAL_WEBHOOK_SECRET no configurada');
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  const signature = event.headers['x-cal-signature-256'];
  const rawBody = event.body;

  if (!signature || !rawBody) {
    console.warn('Missing signature or body');
    return { statusCode: 401, body: 'Missing signature' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Comparación timing-safe
  let validSignature = false;
  try {
    validSignature =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
  } catch {
    validSignature = false;
  }

  if (!validSignature) {
    console.warn('Webhook signature mismatch');
    return { statusCode: 401, body: 'Invalid signature' };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  if (payload.triggerEvent !== 'BOOKING_CREATED') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const booking = payload.payload || {};
  const attendee = booking.attendees?.[0];

  if (!attendee?.name || !attendee?.email) {
    console.error('Webhook sin attendee data:', booking);
    return { statusCode: 200, body: 'No attendee data' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY no configurada');
    return { statusCode: 200, body: 'RESEND_API_KEY missing' };
  }

  const resend = new Resend(apiKey);
  const FROM =
    process.env.EMAIL_FROM_AUTOMATICO ||
    'Juan Fernández, Psicólogo Clínico <noresponder@psicologojuanfernandez.cl>';
  const REPLY_TO = process.env.EMAIL_REPLY_TO || 'juanfernandezpsicologo@gmail.com';
  const SITIO_URL = process.env.SITIO_URL || 'https://psicologojuanfernandez.cl';

  const primerNombre = attendee.name.split(' ')[0];
  const linkConsentimiento =
    `${SITIO_URL}/consentimiento.html` +
    `?nombre=${encodeURIComponent(attendee.name)}` +
    `&email=${encodeURIComponent(attendee.email)}`;

  const eventTitle = booking.eventType?.title || 'sesión';
  const eventSlug = booking.eventType?.slug || '';
  const startTime = booking.startTime
    ? new Date(booking.startTime).toLocaleString('es-CL', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Santiago',
      })
    : '';

  // --- Datos del prestador (públicos, hardcodeados server-side a propósito).
  // El webhook corre server-side y no lee las VITE_ vars del cliente. ---
  const RUT_PRESTADOR = '17.520.730-9';
  const WHATSAPP = '+56 9 7339 4530';
  const MI_FONASA_URL = 'https://mi.fonasa.gob.cl/';
  const WEBPAY_URL = 'https://www.webpay.cl/form-pay/388212';
  const TRANSFER_EMAIL = 'juanfernandezpsicologo@gmail.com';

  // Mapeo slug del evento Cal -> código Fonasa con su string literal del portal
  // (idéntico a lo que el usuario ve en Mi Fonasa, para que seleccione el código
  // correcto). Verificado contra src/lib/cal.js. Si el slug no calza, pagoLineas
  // queda vacío y el email sale sin bloque de pago (degradación segura).
  const FONASA_POR_SLUG = {
    'primera-sesion-bonofonasa':
      "09 08 101 Telerehabilitación: Psicólogo clínico (sesiones 45')",
    'sesiones-de-avance-bonofonasa':
      '09 08 102 Telerehabilitación: Psicoterapia individual',
    'psicoterapia-de-pareja-bonofonasa':
      '09 08 103 Telerehabilitación: Sesión de psicoterapia de pareja (con ambos miembros)',
  };
  const ES_PARTICULAR =
    eventSlug === 'psicoterapia-individual-online-particular-15.000';

  let pagoLineas = [];
  if (FONASA_POR_SLUG[eventSlug]) {
    pagoLineas = [
      'PAGO DE TU SESIÓN (BONO FONASA)',
      'Antes de la sesión necesitas comprar el bono Fonasa:',
      `1. Entra a Mi Fonasa: ${MI_FONASA_URL}`,
      `2. Busca el prestador por RUT: ${RUT_PRESTADOR} (Juan Fernández).`,
      `3. Selecciona el código: ${FONASA_POR_SLUG[eventSlug]}`,
      '4. Paga el bono (copago $5.570 para tramos B, C y D) y recibirás un folio.',
      `5. Envíame el folio por WhatsApp (${WHATSAPP}) antes de la sesión. Sin el folio no puedo registrar la prestación en Fonasa.`,
    ];
  } else if (ES_PARTICULAR) {
    pagoLineas = [
      'PAGO DE TU SESIÓN (PARTICULAR, $15.000)',
      'Puedes pagar de dos formas antes de la sesión:',
      `Opción 1, WebPay: ${WEBPAY_URL}`,
      'Opción 2, transferencia electrónica:',
      '  Banco: BancoEstado (CuentaRUT)',
      '  N° de cuenta: 17520730',
      '  Titular: Juan Fernández',
      `  RUT: ${RUT_PRESTADOR}`,
      `  Correo para el comprobante: ${TRANSFER_EMAIL}`,
      `Envíame el comprobante a ese correo o por WhatsApp (${WHATSAPP}).`,
    ];
  }

  // Bloque de pago con líneas en blanco a los lados (vacío si el slug no calza).
  const bloquePago = pagoLineas.length ? ['', ...pagoLineas, ''] : [];

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [attendee.email],
      reply_to: REPLY_TO,
      subject: 'Antes de tu sesión: consentimiento informado y pago',
      text: [
        `Hola ${primerNombre},`,
        ``,
        `Confirmé tu reserva de "${eventTitle}"${startTime ? ` para el ${startTime}` : ''}.`,
        ``,
        `Antes de la sesión necesito que completes el consentimiento informado. Es un requisito legal (Ley 21.541 de Telemedicina) y toma unos 4 minutos.`,
        ``,
        `Completa aquí:`,
        `${linkConsentimiento}`,
        ``,
        `Llegará una copia firmada a tu email y la podrás descargar en PDF.`,
        ...bloquePago,
        `Si tienes cualquier duda escríbeme por WhatsApp al ${WHATSAPP} o responde a este email.`,
        ``,
        `Nos vemos pronto.`,
        ``,
        `Juan Fernández`,
        `Psicólogo Clínico`,
        `psicologojuanfernandez.cl`,
      ].join('\n'),
    });

    if (result.error) {
      console.error('Resend error en cal-webhook:', result.error);
      return { statusCode: 200, body: 'Email send failed but webhook acknowledged' };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Exception en cal-webhook:', err);
    return { statusCode: 200, body: 'Exception caught' };
  }
};
