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
  const startTime = booking.startTime
    ? new Date(booking.startTime).toLocaleString('es-CL', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Santiago',
      })
    : '';

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [attendee.email],
      reply_to: REPLY_TO,
      subject: 'Requisito antes de tu sesión: consentimiento informado',
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
        ``,
        `Si tienes cualquier duda escríbeme por WhatsApp al +56 9 7339 4530 o responde a este email.`,
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
