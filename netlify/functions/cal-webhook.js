import { Resend } from 'resend';
import crypto from 'crypto';

/**
 * Webhook que Cal.com llama tras BOOKING_CREATED.
 *
 * Flujo:
 *   1. Valida la firma HMAC-SHA-256 del payload con CAL_WEBHOOK_SECRET.
 *   2. Descarta reagendamientos (ver nota abajo) para no reenviar el consentimiento.
 *   3. Extrae nombre y email del attendee.
 *   4. Envía email al paciente con link pre-rellenado al consentimiento.
 *
 * NOTA sobre reagendamientos:
 *   Al reagendar una sesión, Cal.com crea un booking nuevo (uid nuevo) y dispara
 *   BOOKING_CREATED igual que en una reserva nueva. La diferencia es que el payload
 *   de un reagendamiento trae rescheduleUid (uid del booking original) y campos
 *   hermanos (rescheduleId, rescheduleStartTime), que una reserva genuinamente nueva
 *   no tiene. Un paciente que reagenda ya firmó el consentimiento al reservar la
 *   primera vez, así que en ese caso NO reenviamos el correo.
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

  // Reagendamiento: si el payload trae marcas de reschedule, el paciente ya firmó
  // el consentimiento al reservar la primera vez. No reenviamos el correo.
  const esReagendamiento = Boolean(
    booking.rescheduleUid ||
      booking.rescheduleId ||
      booking.fromReschedule ||
      booking.rescheduled === true
  );
  if (esReagendamiento) {
    console.log(
      'Reagendamiento detectado (rescheduleUid=%s); no se reenvía consentimiento',
      booking.rescheduleUid || booking.rescheduleId || booking.fromReschedule || 'true'
    );
    return { statusCode: 200, body: 'Reschedule ignored' };
  }

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

  // --- Versión HTML del correo -------------------------------------------
  // Tabla con estilos inline (lo único confiable en clientes de email). Paleta
  // de marca: sage en cabecera/pie, cream de fondo, terracotta en botones, ink
  // en texto. Sin dependencias nuevas, sin imágenes externas, ancho 600px.
  const C = {
    sage: '#3F5B4A',
    sageDark: '#2F4538',
    cream: '#F6F1E8',
    offwhite: '#FFFDF8',
    terracotta: '#C97B5E',
    ink: '#2A3B4C',
    sageLight: '#A8B5A0',
  };

  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const btn = (href, label, bg) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;">
      <tr><td align="center" bgcolor="${bg}" style="border-radius:8px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:bold;color:#FFFDF8;text-decoration:none;border-radius:8px;">${label}</a>
      </td></tr>
    </table>`;

  // Bloque de pago en HTML, ramificado igual que el texto plano.
  let pagoHtml = '';
  if (FONASA_POR_SLUG[eventSlug]) {
    pagoHtml = `
      <tr><td style="padding:8px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.offwhite};border:1px solid #E7DFD0;border-radius:10px;">
          <tr><td style="padding:20px 22px;">
            <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:17px;color:${C.sageDark};font-weight:bold;">Pago de tu sesión (bono Fonasa)</p>
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">Antes de la sesión necesitas comprar el bono Fonasa:</p>
            <ol style="margin:0 0 14px;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${C.ink};">
              <li>Entra a Mi Fonasa con tu ClaveÚnica.</li>
              <li>Busca el prestador por RUT: <strong>${RUT_PRESTADOR}</strong> (Juan Fernández).</li>
              <li>Selecciona el código: <strong>${esc(FONASA_POR_SLUG[eventSlug])}</strong></li>
              <li>Paga el bono (copago $5.570 para tramos B, C y D) y recibirás un folio.</li>
              <li>Envíame el folio por WhatsApp (${WHATSAPP}) antes de la sesión. Sin el folio no puedo registrar la prestación en Fonasa.</li>
            </ol>
            ${btn(MI_FONASA_URL, 'Ir a Mi Fonasa', C.sage)}
          </td></tr>
        </table>
      </td></tr>`;
  } else if (ES_PARTICULAR) {
    pagoHtml = `
      <tr><td style="padding:8px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.offwhite};border:1px solid #E7DFD0;border-radius:10px;">
          <tr><td style="padding:20px 22px;">
            <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:17px;color:${C.sageDark};font-weight:bold;">Pago de tu sesión (particular, $15.000)</p>
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">Puedes pagar de dos formas antes de la sesión:</p>
            <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.ink};"><strong>Opción 1, WebPay:</strong></p>
            ${btn(WEBPAY_URL, 'Pagar con WebPay', C.terracotta)}
            <p style="margin:14px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.ink};"><strong>Opción 2, transferencia electrónica:</strong></p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">
              <tr><td style="padding:2px 0;width:42%;color:#6A7480;">Banco</td><td style="padding:2px 0;">BancoEstado (CuentaRUT)</td></tr>
              <tr><td style="padding:2px 0;color:#6A7480;">N° de cuenta</td><td style="padding:2px 0;">17520730</td></tr>
              <tr><td style="padding:2px 0;color:#6A7480;">Titular</td><td style="padding:2px 0;">Juan Fernández</td></tr>
              <tr><td style="padding:2px 0;color:#6A7480;">RUT</td><td style="padding:2px 0;">${RUT_PRESTADOR}</td></tr>
              <tr><td style="padding:2px 0;color:#6A7480;">Comprobante a</td><td style="padding:2px 0;">${TRANSFER_EMAIL}</td></tr>
            </table>
            <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">Envíame el comprobante a ese correo o por WhatsApp (${WHATSAPP}).</p>
          </td></tr>
        </table>
      </td></tr>`;
  }

  const htmlBody = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${C.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.cream};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${C.cream};border-radius:14px;overflow:hidden;">
        <tr><td style="background-color:${C.sage};padding:26px 32px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${C.cream};">Juan Fernández</p>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;color:${C.sageLight};text-transform:uppercase;">Psicólogo Clínico</p>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${C.ink};">Hola ${esc(primerNombre)},</p>
          <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${C.ink};">Confirmé tu reserva de <strong>${esc(eventTitle)}</strong>${startTime ? ` para el <strong>${esc(startTime)}</strong>` : ''}.</p>
        </td></tr>

        <tr><td style="padding:6px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.offwhite};border:1px solid #E7DFD0;border-radius:10px;">
            <tr><td style="padding:20px 22px;">
              <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:17px;color:${C.sageDark};font-weight:bold;">Antes de la sesión: consentimiento informado</p>
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">Es un requisito legal (Ley 21.541 de Telemedicina) y toma unos 4 minutos. Recibirás una copia firmada en tu email y la podrás descargar en PDF.</p>
              ${btn(linkConsentimiento, 'Completar consentimiento', C.terracotta)}
            </td></tr>
          </table>
        </td></tr>

        ${pagoHtml}

        <tr><td style="padding:22px 32px 4px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};">Si tienes cualquier duda escríbeme por WhatsApp al ${WHATSAPP} o responde a este email. Nos vemos pronto.</p>
        </td></tr>

        <tr><td style="padding:18px 32px 28px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${C.ink};">Juan Fernández</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#6A7480;">Psicólogo Clínico</p>
        </td></tr>

        <tr><td style="background-color:${C.sageDark};padding:16px 32px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:rgba(246,241,232,0.7);">psicologojuanfernandez.cl · Atención online por videollamada certificada por Fonasa.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [attendee.email],
      reply_to: REPLY_TO,
      subject: 'Antes de tu sesión: consentimiento informado y pago',
      html: htmlBody,
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
