import { Resend } from 'resend';
import { getStore } from '@netlify/blobs';
import crypto from 'crypto';
import { construirCorreo, formatearInicio, reservaDeSlug } from '../lib/correoReserva.js';

/**
 * Webhook que Cal.com llama tras BOOKING_CREATED.
 *
 * REGLA DE NEGOCIO (cambiada en C42)
 *   Antes: un solo correo por persona, en su primer evento y nunca mas.
 *   Ahora: un correo en CADA reserva nueva, con el contenido que corresponde al
 *   tipo de sesion reservada. El motivo es el bono: hay que comprarlo antes de
 *   cada sesion Fonasa, sin excepcion, asi que un control o una sesion de pareja
 *   tambien necesitan sus instrucciones y sus datos de prestador.
 *
 *   Lo que sigue siendo una sola vez por persona es el CONSENTIMIENTO INFORMADO:
 *   se firma una vez y sigue vigente. El registro de Netlify Blobs ya no decide
 *   si se envia el correo, decide si el correo lleva el bloque de consentimiento.
 *
 * Flujo:
 *   1. Valida la firma HMAC-SHA-256 del payload con CAL_WEBHOOK_SECRET.
 *   2. Descarta reagendamientos por las marcas del payload.
 *   3. Consulta el registro persistente por email: si a esa persona ya se le
 *      pidio el consentimiento antes, el correo sale sin ese paso.
 *   4. Arma el correo segun el slug del evento (netlify/lib/correoReserva.js) y
 *      lo envia. Si incluia consentimiento y el envio fue exitoso, deja al email
 *      registrado para no volver a pedirselo.
 *
 * NOTA sobre reagendamientos:
 *   Al reagendar, Cal.com crea un booking nuevo (uid nuevo) y dispara
 *   BOOKING_CREATED igual que una reserva nueva. La diferencia es que el payload
 *   trae rescheduleUid (uid del booking original) y campos hermanos. No se envia
 *   correo: no es una sesion adicional, es la misma movida de hora, y el bono
 *   comprado sigue sirviendo (vence a los 30 dias, no en la fecha original).
 *   La confirmacion del cambio de hora la manda Cal.com por su cuenta.
 *
 * Registro (Netlify Blobs):
 *   Store 'consentimiento-solicitado', clave = email en minusculas. Si el almacen
 *   no esta disponible se degrada de forma segura PIDIENDO el consentimiento (es
 *   un requisito legal: preferimos pedirlo dos veces a que un paciente nuevo se
 *   quede sin firmarlo). El unico riesgo residual es un paso repetido en esa rara
 *   ventana.
 *
 * Variables de entorno requeridas:
 *   - CAL_WEBHOOK_SECRET   (string aleatorio, mismo configurado en Cal.com)
 *   - RESEND_API_KEY
 *   - EMAIL_FROM_AUTOMATICO
 *   - EMAIL_REPLY_TO
 *   - SITIO_URL            (default: https://psicologojuanfernandez.cl)
 *
 * Variable de entorno opcional:
 *   - CONSENTIMIENTO_YA_OBTENIDO  Lista de emails (separados por coma o salto de
 *       linea) de pacientes que ya firmaron antes de existir el registro. Reciben
 *       el correo igual, pero sin el paso de consentimiento. Se deja fuera del
 *       repo por ser dato de pacientes.
 *
 * Retorna 200 incluso ante errores no criticos para evitar reintentos de Cal.com
 * que solo generarian ruido sin resolver el problema raiz.
 */

// Fabrica del almacen, aislada para poder inyectar un doble en las pruebas.
let _crearRegistro = () => getStore('consentimiento-solicitado');

/** Solo para tests: sustituye la fabrica del registro por un doble en memoria. */
export function _setRegistroFactory(fn) {
  _crearRegistro = fn;
}

// Devuelve el store o null si Blobs no esta disponible (degradacion segura).
function obtenerRegistro() {
  try {
    return _crearRegistro();
  } catch (err) {
    console.warn('Netlify Blobs no disponible, se pedira el consentimiento igual:', err?.message);
    return null;
  }
}

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

  // Comparacion timing-safe
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

  // Reagendamiento: misma sesion movida de hora, no una sesion adicional.
  const esReagendamiento = Boolean(
    booking.rescheduleUid ||
      booking.rescheduleId ||
      booking.fromReschedule ||
      booking.rescheduled === true
  );
  if (esReagendamiento) {
    console.log(
      'Reagendamiento detectado (rescheduleUid=%s); no se envia correo',
      booking.rescheduleUid || booking.rescheduleId || booking.fromReschedule || 'true'
    );
    return { statusCode: 200, body: 'Reschedule ignored' };
  }

  const attendee = booking.attendees?.[0];

  if (!attendee?.name || !attendee?.email) {
    console.error('Webhook sin attendee data:', booking);
    return { statusCode: 200, body: 'No attendee data' };
  }

  // --- Decision: este correo lleva el paso de consentimiento? ---------------
  // Clave normalizada a minusculas.
  const emailKey = attendee.email.trim().toLowerCase();
  let pedirConsentimiento = true;

  // Lista opcional de emails que YA tienen el consentimiento firmado desde antes
  // de existir este registro (tipicamente pacientes en tratamiento al desplegar
  // esto). Se configura en la env var CONSENTIMIENTO_YA_OBTENIDO de Netlify.
  const emailsPrevios = (process.env.CONSENTIMIENTO_YA_OBTENIDO || '')
    .split(/[,\n]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emailsPrevios.includes(emailKey)) {
    console.log('Email %s marcado con consentimiento previo (env)', emailKey);
    pedirConsentimiento = false;
  }

  const registro = obtenerRegistro();
  if (pedirConsentimiento && registro) {
    try {
      const yaSolicitado = await registro.get(emailKey);
      if (yaSolicitado) {
        console.log('Consentimiento ya solicitado antes a %s; se omite el paso', emailKey);
        pedirConsentimiento = false;
      }
    } catch (err) {
      // Lectura fallida: degradacion segura, se pide igual.
      console.warn('No se pudo leer el registro (se pedira igual):', err?.message);
    }
  }

  const eventSlug = booking.eventType?.slug || '';
  const eventTitle = booking.eventType?.title || '';
  const ficha = reservaDeSlug(eventSlug);

  // Trazabilidad en los logs de Netlify: con esto se ve de un vistazo por que un
  // correo salio con un contenido y no con otro. Va antes de cualquier corte por
  // configuracion faltante, para que quede registro incluso si no se envio nada.
  console.log(
    'Reserva %s (slug=%s, tipo=%s, consentimiento=%s)',
    booking.uid || 'sin-uid',
    eventSlug || 'sin-slug',
    ficha.tipo || 'desconocido',
    pedirConsentimiento ? 'si' : 'no'
  );

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

  const linkConsentimiento = pedirConsentimiento
    ? `${SITIO_URL}/consentimiento.html` +
      `?nombre=${encodeURIComponent(attendee.name)}` +
      `&email=${encodeURIComponent(attendee.email)}`
    : null;

  const inicioTexto = formatearInicio(booking.startTime);

  const { asunto, html, texto } = construirCorreo({
    nombre: attendee.name,
    slug: eventSlug,
    tituloEvento: eventTitle,
    inicioTexto,
    linkConsentimiento,
  });

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [attendee.email],
      reply_to: REPLY_TO,
      subject: asunto,
      html,
      text: texto,
    });

    if (result.error) {
      console.error('Resend error en cal-webhook:', result.error);
      // No registramos: al no haberse enviado, un evento futuro debe reintentar.
      return { statusCode: 200, body: 'Email send failed but webhook acknowledged' };
    }

    // Envio exitoso. Solo si el correo llevaba el consentimiento dejamos
    // constancia, para no volver a pedirselo a esta persona. Best-effort: si el
    // registro falla ya se envio, asi que solo logueamos (a lo sumo se arriesga
    // un paso repetido en una reserva futura).
    if (pedirConsentimiento && registro) {
      try {
        await registro.set(
          emailKey,
          JSON.stringify({
            solicitadoEn: new Date().toISOString(),
            evento: eventTitle || eventSlug,
            uid: booking.uid || null,
          })
        );
      } catch (err) {
        console.warn('Consentimiento enviado pero no se pudo registrar:', err?.message);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Exception en cal-webhook:', err);
    return { statusCode: 200, body: 'Exception caught' };
  }
};
