import { Resend } from 'resend';

/**
 * Recibe el POST del formulario de consentimiento.
 * Envía 2 emails vía Resend:
 *   1. Al prestador (Juan): PDF firmado + firma PNG como attachments. Evidencia legal.
 *   2. Al paciente: copia del PDF firmado como attachment.
 *
 * Variables de entorno requeridas (server-side, sin prefijo VITE_):
 *   - RESEND_API_KEY
 *   - EMAIL_FROM_AUTOMATICO        (default: noresponder@psicologojuanfernandez.cl)
 *   - EMAIL_DESTINO_PRESTADOR      (default: juanfernandezpsicologo@gmail.com)
 *   - EMAIL_REPLY_TO               (default: juanfernandezpsicologo@gmail.com)
 */

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  const {
    datos,
    firmaBase64,
    pdfBase64,
    hashDocumento,
    timestampISO,
    userAgent,
    zonaHoraria,
    tipo,
  } = payload;

  // Ramo del documento: 'asentimiento' (menores) o 'consentimiento' (default).
  const esAsentimiento = tipo === 'asentimiento';
  const DOC = esAsentimiento ? 'asentimiento' : 'consentimiento';
  const DOC_CAP = esAsentimiento ? 'Asentimiento' : 'Consentimiento';

  if (
    !datos?.nombre ||
    !datos?.rut ||
    !datos?.email ||
    !firmaBase64 ||
    !pdfBase64
  ) {
    return { statusCode: 400, body: 'Payload incompleto' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY no configurada en Netlify env vars');
    return { statusCode: 500, body: 'RESEND_API_KEY no configurada' };
  }

  const resend = new Resend(apiKey);

  const FROM =
    process.env.EMAIL_FROM_AUTOMATICO ||
    'Juan Fernández, Psicólogo Clínico <noresponder@psicologojuanfernandez.cl>';
  const TO_PRESTADOR =
    process.env.EMAIL_DESTINO_PRESTADOR || 'juanfernandezpsicologo@gmail.com';
  const REPLY_TO = process.env.EMAIL_REPLY_TO || 'juanfernandezpsicologo@gmail.com';

  // Decodificar base64 (separar prefijo data:image/png;base64,)
  const firmaBuffer = Buffer.from(firmaBase64.split(',')[1] || firmaBase64, 'base64');
  const pdfBuffer = Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64');

  const filenamePDF = `${DOC}-${datos.rut}-${Date.now()}.pdf`;
  const fechaLegible = new Date(timestampISO).toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: zonaHoraria || 'America/Santiago',
  });

  const emailPrestador = {
    from: FROM,
    to: [TO_PRESTADOR],
    reply_to: REPLY_TO,
    subject: `${DOC_CAP} firmado: ${datos.nombre} (${datos.rut})`,
    text: [
      `Nuevo ${DOC} informado firmado.`,
      ``,
      `Paciente:`,
      `  Nombre: ${datos.nombre}`,
      `  RUT: ${datos.rut}`,
      `  Email: ${datos.email}`,
      `  Teléfono: ${datos.telefono}`,
      ``,
      `Metadatos de la firma:`,
      `  Fecha: ${fechaLegible}`,
      `  Timestamp ISO: ${timestampISO}`,
      `  Zona horaria: ${zonaHoraria}`,
      `  User-Agent: ${userAgent}`,
      `  Hash SHA-256: ${hashDocumento}`,
      ``,
      `Adjuntos: PDF firmado + firma manuscrita (PNG).`,
      `Archivar este email por mínimo 5 años (Art. 2515 CC).`,
    ].join('\n'),
    attachments: [
      { filename: filenamePDF, content: pdfBuffer },
      { filename: `firma-${datos.rut}.png`, content: firmaBuffer },
    ],
  };

  const primerNombre = datos.nombre.split(' ')[0];

  const emailPaciente = {
    from: FROM,
    to: [datos.email],
    reply_to: REPLY_TO,
    subject: `Tu copia del ${DOC} informado`,
    text: [
      `Hola ${primerNombre},`,
      ``,
      `Recibí tu ${DOC} informado firmado. Adjunto encuentras tu copia en PDF.`,
      ``,
      `Si tienes dudas antes de la sesión, escríbeme por WhatsApp al +56 9 7339 4530 o responde directamente a este email.`,
      ``,
      `Nos vemos pronto.`,
      ``,
      `Juan Fernández`,
      `Psicólogo Clínico`,
      `psicologojuanfernandez.cl`,
    ].join('\n'),
    attachments: [{ filename: filenamePDF, content: pdfBuffer }],
  };

  try {
    const [r1, r2] = await Promise.all([
      resend.emails.send(emailPrestador),
      resend.emails.send(emailPaciente),
    ]);

    if (r1.error || r2.error) {
      console.error('Resend errors:', {
        prestador: r1.error,
        paciente: r2.error,
      });
      return {
        statusCode: 502,
        body: JSON.stringify({
          errorPrestador: r1.error || null,
          errorPaciente: r2.error || null,
        }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Resend exception:', err);
    return { statusCode: 500, body: `Resend error: ${err.message}` };
  }
};
