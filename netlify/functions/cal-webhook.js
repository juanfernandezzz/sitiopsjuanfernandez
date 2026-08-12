import { Resend } from 'resend';
import { getStore } from '@netlify/blobs';
import crypto from 'crypto';

/**
 * Webhook que Cal.com llama tras BOOKING_CREATED, con TODO el contenido del
 * correo incluido en este mismo archivo.
 *
 * POR QUE UN SOLO ARCHIVO (C44)
 *   En C42 el contenido del correo vivia en netlify/lib/correoReserva.js, fuera
 *   de la carpeta de funciones, y la funcion lo importaba con una ruta relativa.
 *   El sitio se desplego con los cambios pero el correo siguio saliendo con el
 *   formato viejo, lo que apunta a que ese import cruzado no se empaqueto en la
 *   funcion desplegada. El bundle se habia verificado con esbuild en local, no
 *   con el pipeline real de Netlify.
 *
 *   Volver a un archivo autocontenido elimina esa clase de falla completa: es la
 *   misma forma que tenia antes de C42, que llevaba meses funcionando. El costo
 *   es un archivo largo; a cambio, no hay nada que empaquetar mal.
 *
 *   Para previsualizar el copy sin desplegar, scripts/previsualizar-correos.mjs
 *   importa construirCorreo desde AQUI. Fuente unica, sin copias paralelas.
 *
 * COMO SABER QUE VERSION ESTA VIVA
 *   Un GET a esta funcion devuelve un JSON con la revision desplegada. Es la
 *   unica forma de comprobar desde fuera si el deploy actualizo la funcion, sin
 *   entrar a Netlify y sin mandar un correo de prueba a nadie:
 *     curl https://psicologojuanfernandez.cl/.netlify/functions/cal-webhook
 *   No expone nada: solo un identificador de version.
 *
 * REGLA DE NEGOCIO
 *   Se envia un correo en CADA reserva nueva, con el contenido que corresponde al
 *   tipo de sesion. El motivo es el bono: hay que comprarlo antes de cada sesion
 *   Fonasa, sin excepcion, asi que un control o una sesion de pareja tambien
 *   necesitan sus instrucciones y sus datos de prestador.
 *
 *   Lo que sigue siendo una sola vez por persona es el CONSENTIMIENTO INFORMADO:
 *   se firma una vez y sigue vigente. El registro de Netlify Blobs no decide si
 *   se envia el correo, decide si el correo lleva el bloque de consentimiento.
 *
 *   El contenido de pago se ramifica por slug del evento de Cal:
 *     tres eventos Fonasa  -> datos del prestador para emitir el bono.
 *     evento particular    -> transferencia, pago POSTERIOR a la sesion.
 *     slug desconocido     -> sin bloque de pago (degradacion segura: nunca
 *                             afirmamos un codigo o un monto equivocado).
 *
 * Flujo:
 *   1. Valida la firma HMAC-SHA-256 del payload con CAL_WEBHOOK_SECRET.
 *   2. Descarta reagendamientos por las marcas del payload.
 *   3. Consulta el registro persistente por email: si a esa persona ya se le
 *      pidio el consentimiento antes, el correo sale sin ese paso.
 *   4. Arma el correo segun el slug del evento y lo envia. Si incluia
 *      consentimiento y el envio fue exitoso, deja al email registrado.
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
 *   quede sin firmarlo).
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

// Identificador de la version desplegada. SUBIR ESTE NUMERO en cada cambio del
// correo: es lo que permite comprobar con un GET si el deploy llego de verdad.
export const REVISION = 'C44';

/* ===========================================================================
 * PARTE 1: contenido del correo (datos y funciones puras, sin red)
 * ======================================================================== */

// --- Datos del prestador (publicos, estables) --------------------------------

export const PRESTADOR = {
  // Nombre legal completo: es el que aparece en Mi Fonasa al buscar por RUT.
  nombreCompleto: 'Juan Daniel Fernández Arce',
  // Nombre de trato en la firma del correo.
  nombreCorto: 'Juan Fernández',
  titulo: 'Psicólogo Clínico',
  rut: '17.520.730-9',
  // Geograficos: la atencion es online, esto es solo lo que pide el bono.
  region: 'Región de Valparaíso',
  comuna: 'Valparaíso',
};

export const CONTACTO = {
  whatsappDisplay: '+56 9 7339 4530',
  whatsappUrl: 'https://wa.me/56973394530',
  email: 'juanfernandezpsicologo@gmail.com',
  doxyUrl: 'https://doxy.me/psicologojuanfernandez',
  miFonasaUrl: 'https://mi.fonasa.gob.cl/',
  webpayUrl: 'https://www.webpay.cl/form-pay/388212',
};

export const PRECIOS = {
  fonasaCopago: '$5.570',
  particular: '$15.000',
};

// Cuenta de destino del pago particular. "Cuenta vista" es como BancoEstado
// clasifica la CuentaRUT: se explicita porque algunos bancos piden el tipo de
// cuenta al cargar el destinatario y elegir "corriente" hace fallar la
// transferencia.
export const TRANSFERENCIA = {
  banco: 'BancoEstado',
  tipoCuenta: 'Cuenta RUT (cuenta vista)',
  cuenta: '17520730',
  titular: PRESTADOR.nombreCompleto,
  rut: PRESTADOR.rut,
  correoComprobante: CONTACTO.email,
};

// --- Catalogo por slug de Cal.com --------------------------------------------
//
// Las claves son los slugs reales de cal.com/psicologojuanfernandez, los mismos
// que declara src/lib/cal.js. Verificados en Cal.com el 9 de agosto de 2026.
//
// codigo:       el numero tal como lo pide el sistema Fonasa (sin espacios).
// codigoPortal: el texto literal del arancel, para que la persona reconozca la
//               linea exacta que debe seleccionar en el listado del portal.
// trato:        'tu' o 'ustedes'. La sesion de pareja se le habla a dos.
//
// La sesion de pareja se mantiene aqui aunque hoy este sin cupos en el sitio:
// el evento sigue existiendo en Cal.com y el flujo debe funcionar el dia que se
// reabra, sin tocar codigo.

export const CATALOGO = {
  'primera-sesion-bonofonasa': {
    tipo: 'fonasa',
    nombreSesion: 'primera sesión',
    trato: 'tu',
    codigo: '0908101',
    codigoPortal: "09 08 101 Telerehabilitación: Psicólogo clínico (sesiones 45')",
    asuntoCon: 'Antes de tu primera sesión: consentimiento y bono Fonasa',
    asuntoSin: 'Antes de tu primera sesión: cómo comprar tu bono Fonasa',
    nota: null,
  },
  'sesiones-de-avance-bonofonasa': {
    tipo: 'fonasa',
    nombreSesion: 'sesión de avance',
    trato: 'tu',
    codigo: '0908102',
    codigoPortal: '09 08 102 Telerehabilitación: Psicoterapia individual',
    asuntoCon: 'Antes de tu sesión de avance: consentimiento y bono Fonasa',
    asuntoSin: 'Antes de tu sesión de avance: cómo comprar tu bono Fonasa',
    nota: null,
  },
  'psicoterapia-de-pareja-bonofonasa': {
    tipo: 'fonasa',
    nombreSesion: 'sesión de pareja',
    trato: 'ustedes',
    codigo: '0908103',
    codigoPortal:
      '09 08 103 Telerehabilitación: Sesión de psicoterapia de pareja (con ambos miembros)',
    asuntoCon: 'Antes de su sesión de pareja: consentimiento y bono Fonasa',
    asuntoSin: 'Antes de su sesión de pareja: cómo comprar el bono Fonasa',
    nota: 'La sesión de pareja requiere que ambos estén presentes durante los 45 minutos.',
  },
  'psicoterapia-individual-online-particular-15.000': {
    tipo: 'particular',
    nombreSesion: 'sesión particular',
    trato: 'tu',
    codigo: null,
    codigoPortal: null,
    asuntoCon: 'Antes de tu sesión: consentimiento informado y datos de pago',
    asuntoSin: 'Antes de tu sesión: los datos de pago de tu sesión particular',
    nota: null,
  },
};

// Entrada de respaldo para un slug que no reconocemos (evento nuevo en Cal.com
// que todavia no se agrego aqui). El correo sale sin bloque de pago: preferimos
// no decir nada de pago antes que decir un codigo o un monto equivocado.
const GENERICO = {
  tipo: null,
  nombreSesion: 'sesión',
  trato: 'tu',
  codigo: null,
  codigoPortal: null,
  asuntoCon: 'Antes de tu sesión: consentimiento informado',
  asuntoSin: 'Antes de tu sesión: lo que necesitas saber',
  nota: null,
};

/** Ficha de contenido para un slug de Cal, con respaldo generico. */
export function reservaDeSlug(slug) {
  return CATALOGO[slug] || GENERICO;
}

// --- Utilidades de armado -----------------------------------------------------

const C = {
  sage: '#3F5B4A',
  sageDark: '#2F4538',
  cream: '#F6F1E8',
  offwhite: '#FFFDF8',
  terracotta: '#C97B5E',
  terracottaDark: '#B0664A',
  ink: '#2A3B4C',
  inkSoft: '#6A7480',
  sageLight: '#A8B5A0',
  linea: '#E7DFD0',
};

const FUENTE_CUERPO = "Arial,Helvetica,sans-serif";
const FUENTE_TITULO = "Georgia,'Times New Roman',serif";

export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const boton = (href, etiqueta, fondo) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 2px;">
    <tr><td align="center" bgcolor="${fondo}" style="border-radius:8px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FUENTE_TITULO};font-size:16px;font-weight:bold;color:${C.offwhite};text-decoration:none;border-radius:8px;">${etiqueta}</a>
    </td></tr>
  </table>`;

const parrafo = (texto, extra = '') =>
  `<p style="margin:0 0 12px;font-family:${FUENTE_CUERPO};font-size:15px;line-height:1.65;color:${C.ink};${extra}">${texto}</p>`;

// Tarjeta numerada. El numero va dentro del titulo para que ningun cliente de
// correo desarme la fila si no soporta bien el layout de tabla anidada.
const tarjeta = (numero, titulo, cuerpo) =>
  `<tr><td style="padding:8px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.offwhite};border:1px solid ${C.linea};border-radius:10px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 10px;font-family:${FUENTE_TITULO};font-size:17px;line-height:1.35;color:${C.sageDark};font-weight:bold;">${numero ? `Paso ${numero}. ` : ''}${titulo}</p>
        ${cuerpo}
      </td></tr>
    </table>
  </td></tr>`;

// Tabla etiqueta/valor. Se usa para los datos que la persona tiene que copiar
// literalmente en otro sistema (Mi Fonasa, el banco), donde un renglon en prosa
// se lee peor y se transcribe con mas error.
const tablaDatos = (filas) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FUENTE_CUERPO};font-size:15px;line-height:1.6;color:${C.ink};margin:0 0 12px;">
    ${filas
      .map(
        ([etiqueta, valor]) =>
          `<tr><td style="padding:3px 10px 3px 0;width:42%;color:${C.inkSoft};vertical-align:top;">${esc(etiqueta)}</td><td style="padding:3px 0;font-weight:bold;">${esc(valor)}</td></tr>`
      )
      .join('')}
  </table>`;

const listaPasos = (pasos) =>
  `<ol style="margin:0 0 12px;padding-left:20px;font-family:${FUENTE_CUERPO};font-size:15px;line-height:1.7;color:${C.ink};">
    ${pasos.map((p) => `<li style="margin-bottom:4px;">${p}</li>`).join('')}
  </ol>`;

// Aviso de borde terracota. Reservado para lo unico que, si se pasa por alto,
// deja la sesion sin poder realizarse.
const aviso = (texto) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:rgba(201,123,94,0.08);border-left:3px solid ${C.terracotta};border-radius:0 8px 8px 0;margin:4px 0 0;">
    <tr><td style="padding:14px 16px;font-family:${FUENTE_CUERPO};font-size:14.5px;line-height:1.6;color:${C.ink};">${texto}</td></tr>
  </table>`;

const numeroEnPalabra = (n) => ({ 1: 'un', 2: 'dos', 3: 'tres' })[n] || String(n);

/**
 * Fecha y hora de la sesion en horario de Chile, lista para incrustar en una
 * frase: "jueves 20 de agosto de 2026 a las 15:00 horas".
 *
 * Se arma por partes en vez de con dateStyle/timeStyle porque el formato largo
 * de es-CL termina en "p. m." (con punto final) y al meterlo en una oracion
 * quedaba un punto doble. De paso el reloj de 24 horas evita la confusion de
 * am/pm y el dia de la semana baja las inasistencias por dia equivocado.
 *
 * @param {string|Date} inicio  startTime del booking de Cal (ISO) o Date.
 * @returns {string} cadena lista para la frase, o '' si no hay dato valido.
 */
export function formatearInicio(inicio) {
  if (!inicio) return '';
  const fecha = new Date(inicio);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = fecha
    .toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Santiago',
    })
    // es-CL intercala una coma tras el dia de la semana; dentro de la frase
    // "para el jueves, 20 de agosto" corta mal la lectura.
    .replace(/^([^,]+),\s*/, '$1 ');
  const hora = fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  });
  return `${dia} a las ${hora} horas`;
}

// --- Armado del correo --------------------------------------------------------

/**
 * Construye el correo de una reserva.
 *
 * @param {object} datos
 * @param {string} datos.nombre            Nombre de quien reserva (tal como llega de Cal).
 * @param {string} datos.slug              Slug del evento de Cal.
 * @param {string} [datos.tituloEvento]    Titulo del evento, para el parrafo de confirmacion.
 * @param {string} [datos.inicioTexto]     Fecha y hora ya formateadas en es-CL, o vacio.
 * @param {string|null} [datos.linkConsentimiento]  Si viene, se pide el consentimiento.
 * @returns {{asunto: string, html: string, texto: string}}
 */
export function construirCorreo({
  nombre,
  slug,
  tituloEvento,
  inicioTexto = '',
  linkConsentimiento = null,
}) {
  const ficha = reservaDeSlug(slug);
  const primerNombre = String(nombre || '').trim().split(/\s+/)[0] || 'hola';
  const conConsentimiento = Boolean(linkConsentimiento);
  const plural = ficha.trato === 'ustedes';
  const evento = tituloEvento || ficha.nombreSesion;

  // Numeracion: solo se cuentan como "paso" las acciones que van ANTES de la
  // sesion. El consentimiento, cuando toca, siempre va primero (es el requisito
  // legal y es el que mas gente abandona si queda sepultado bajo otra cosa). El
  // bono Fonasa es el segundo. El pago particular NO se numera: es posterior a
  // la sesion, y presentarlo como tarea previa desordena el flujo real.
  let n = 0;
  const nConsentimiento = conConsentimiento ? ++n : null;
  const nPago = ficha.tipo === 'fonasa' ? ++n : null;
  const totalPasos = n;

  const asunto = conConsentimiento ? ficha.asuntoCon : ficha.asuntoSin;

  // Texto de vista previa (lo que se lee en la bandeja junto al asunto). Es el
  // segundo elemento mas leido despues del asunto y por defecto los clientes
  // rellenan con el primer texto del cuerpo, que aqui seria el saludo.
  const preheader =
    totalPasos === 2
      ? 'Dos pasos breves y queda todo listo para la sesión.'
      : totalPasos === 1
        ? 'Un paso breve y queda todo listo para la sesión.'
        : 'Los datos de pago y cómo entras a la videollamada.';

  // ---------------- Intro ----------------

  const frasePasos =
    totalPasos === 0
      ? ficha.tipo === 'particular'
        ? 'Aquí abajo tienes los datos de pago y cómo entras a la videollamada.'
        : 'Aquí abajo tienes cómo entras a la videollamada.'
      : plural
        ? `Antes de que nos veamos hay ${numeroEnPalabra(totalPasos)} paso${totalPasos > 1 ? 's' : ''} de parte de ustedes. Toman pocos minutos y los pueden hacer desde este mismo correo.`
        : `Antes de que nos veamos hay ${numeroEnPalabra(totalPasos)} paso${totalPasos > 1 ? 's' : ''} de tu parte. Toma${totalPasos > 1 ? 'n' : ''} pocos minutos y lo${totalPasos > 1 ? 's' : ''} puedes hacer desde este mismo correo.`;

  const introHtml = [
    parrafo(`Hola ${esc(primerNombre)},`, 'font-size:16px;'),
    parrafo(
      `Confirmé ${plural ? 'su' : 'tu'} reserva de <strong>${esc(evento)}</strong>${inicioTexto ? ` para el <strong>${esc(inicioTexto)}</strong>` : ''}.`,
      'font-size:16px;'
    ),
    frasePasos ? parrafo(frasePasos, 'font-size:16px;') : '',
    ficha.nota ? parrafo(esc(ficha.nota), `font-size:15px;color:${C.inkSoft};`) : '',
  ].join('');

  const introTexto = [
    `Hola ${primerNombre},`,
    '',
    `Confirmé ${plural ? 'su' : 'tu'} reserva de "${evento}"${inicioTexto ? ` para el ${inicioTexto}` : ''}.`,
    ...(frasePasos ? ['', frasePasos] : []),
    ...(ficha.nota ? ['', ficha.nota] : []),
  ];

  // ---------------- Paso consentimiento ----------------

  let consentimientoHtml = '';
  const consentimientoTexto = [];
  if (conConsentimiento) {
    consentimientoHtml = tarjeta(
      nConsentimiento,
      'Firma tu consentimiento informado',
      [
        parrafo(
          'Es un requisito de la Ley 21.541 de Telemedicina y toma unos 4 minutos. Te llega una copia firmada a tu correo y la puedes descargar en PDF.'
        ),
        boton(linkConsentimiento, 'Completar consentimiento', C.terracotta),
      ].join('')
    );
    consentimientoTexto.push(
      '',
      `PASO ${nConsentimiento}. FIRMA TU CONSENTIMIENTO INFORMADO`,
      'Es un requisito de la Ley 21.541 de Telemedicina y toma unos 4 minutos. Te llega una copia firmada a tu correo y la puedes descargar en PDF.',
      '',
      `Complétalo aquí: ${linkConsentimiento}`
    );
  }

  // ---------------- Paso pago ----------------

  let pagoHtml = '';
  const pagoTexto = [];

  if (ficha.tipo === 'fonasa') {
    const filas = [
      ['Nombre del prestador', PRESTADOR.nombreCompleto],
      ['RUT', PRESTADOR.rut],
      ['Región', PRESTADOR.region],
      ['Comuna', PRESTADOR.comuna],
      ['Código de prestación', ficha.codigo],
      ['Copago', `${PRECIOS.fonasaCopago} (tramos B, C y D)`],
    ];

    const pasos = [
      'Entra a Mi Fonasa con tu ClaveÚnica.',
      'Abre la compra de bono en línea.',
      `Busca al prestador por RUT: <strong>${esc(PRESTADOR.rut)}</strong>.`,
      `Si el sistema pide ubicación, indica <strong>${esc(PRESTADOR.region)}</strong>, comuna <strong>${esc(PRESTADOR.comuna)}</strong>.`,
      `Selecciona el código de prestación <strong>${esc(ficha.codigo)}</strong>. En el listado aparece como: ${esc(ficha.codigoPortal)}`,
      `Paga el copago de <strong>${PRECIOS.fonasaCopago}</strong> y descarga el bono con su folio.`,
      `Envíame el folio por WhatsApp al <strong>${esc(CONTACTO.whatsappDisplay)}</strong>.`,
    ];

    // Titulo en singular incluso en la sesion de pareja: el bono lo emite quien
    // reservo, y los pasos de abajo se le hablan a esa persona. El plural queda
    // para lo que si es de los dos (la reserva, la hora, la videollamada).
    pagoHtml = tarjeta(
      nPago,
      'Compra el bono Fonasa y envíame el folio',
      [
        parrafo('Estos son los datos que te va a pedir el sistema de Fonasa:'),
        tablaDatos(filas),
        parrafo(
          `La atención es online por videollamada. La región y la comuna aparecen solo porque Fonasa las exige para emitir el bono, no cambian nada de la sesión.`,
          `font-size:14px;color:${C.inkSoft};`
        ),
        listaPasos(pasos),
        boton(CONTACTO.miFonasaUrl, 'Ir a Mi Fonasa', C.sage),
        aviso(
          `<strong>Necesito el folio antes de la sesión, sin excepción.</strong> Sin el folio no puedo registrar la prestación en Fonasa. El bono vence a los 30 días de emitido, así que conviene comprarlo cerca de la fecha de la sesión.`
        ),
      ].join('')
    );

    pagoTexto.push(
      '',
      `PASO ${nPago}. COMPRA EL BONO FONASA Y ENVÍAME EL FOLIO`,
      'Estos son los datos que te va a pedir el sistema de Fonasa:',
      '',
      ...filas.map(([etiqueta, valor]) => `  ${etiqueta}: ${valor}`),
      '',
      'La atención es online por videollamada. La región y la comuna aparecen solo porque Fonasa las exige para emitir el bono, no cambian nada de la sesión.',
      '',
      '1. Entra a Mi Fonasa con tu ClaveÚnica.',
      '2. Abre la compra de bono en línea.',
      `3. Busca al prestador por RUT: ${PRESTADOR.rut}.`,
      `4. Si el sistema pide ubicación, indica ${PRESTADOR.region}, comuna ${PRESTADOR.comuna}.`,
      `5. Selecciona el código de prestación ${ficha.codigo}. En el listado aparece como: ${ficha.codigoPortal}`,
      `6. Paga el copago de ${PRECIOS.fonasaCopago} y descarga el bono con su folio.`,
      `7. Envíame el folio por WhatsApp al ${CONTACTO.whatsappDisplay}.`,
      '',
      `Mi Fonasa: ${CONTACTO.miFonasaUrl}`,
      '',
      'IMPORTANTE: necesito el folio antes de la sesión, sin excepción. Sin el folio no puedo registrar la prestación en Fonasa. El bono vence a los 30 días de emitido, así que conviene comprarlo cerca de la fecha de la sesión.'
    );
  } else if (ficha.tipo === 'particular') {
    const filas = [
      ['Banco', TRANSFERENCIA.banco],
      ['Tipo de cuenta', TRANSFERENCIA.tipoCuenta],
      ['N° de cuenta', TRANSFERENCIA.cuenta],
      ['Titular', TRANSFERENCIA.titular],
      ['RUT', TRANSFERENCIA.rut],
      ['Correo', TRANSFERENCIA.correoComprobante],
    ];

    pagoHtml = tarjeta(
      nPago,
      `Cómo se paga tu sesión particular (${PRECIOS.particular})`,
      [
        parrafo(
          '<strong>La sesión particular se paga después de la sesión</strong>, por transferencia electrónica a esta cuenta:'
        ),
        tablaDatos(filas),
        parrafo(
          `Cuando transfieras, envíame el comprobante por WhatsApp al ${esc(CONTACTO.whatsappDisplay)} o a ${esc(TRANSFERENCIA.correoComprobante)}.`
        ),
        parrafo(
          `Si prefieres pagar con tarjeta, también puedes hacerlo por WebPay.`,
          `font-size:14px;color:${C.inkSoft};`
        ),
        boton(CONTACTO.webpayUrl, 'Pagar con WebPay', C.sage),
      ].join('')
    );

    pagoTexto.push(
      '',
      `CÓMO SE PAGA TU SESIÓN PARTICULAR (${PRECIOS.particular})`,
      'La sesión particular se paga DESPUÉS de la sesión, por transferencia electrónica a esta cuenta:',
      '',
      ...filas.map(([etiqueta, valor]) => `  ${etiqueta}: ${valor}`),
      '',
      `Cuando transfieras, envíame el comprobante por WhatsApp al ${CONTACTO.whatsappDisplay} o a ${TRANSFERENCIA.correoComprobante}.`,
      '',
      `Si prefieres pagar con tarjeta, también puedes hacerlo por WebPay: ${CONTACTO.webpayUrl}`
    );
  }

  // ---------------- Cierre ----------------

  const llegadaTexto = `El día de ${plural ? 'su' : 'tu'} hora ${plural ? 'entran' : 'entras'} a la videollamada desde el navegador, sin descargar nada. La consulta usa Doxy.me, plataforma certificada por Fonasa.`;
  const dudasTexto = `Si ${plural ? 'tienen' : 'tienes'} cualquier duda, ${plural ? 'escríbanme' : 'escríbeme'} por WhatsApp al ${CONTACTO.whatsappDisplay} o ${plural ? 'respondan' : 'responde'} a este correo. Nos vemos pronto.`;

  const cierreHtml = `
    <tr><td style="padding:22px 32px 4px;">
      ${parrafo(`${esc(llegadaTexto)} <a href="${CONTACTO.doxyUrl}" target="_blank" style="color:${C.sage};">Sala de espera</a>.`)}
      ${parrafo(esc(dudasTexto))}
    </td></tr>

    <tr><td style="padding:12px 32px 28px;">
      <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:15px;line-height:1.5;color:${C.ink};">${PRESTADOR.nombreCorto}</p>
      <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:14px;line-height:1.5;color:${C.inkSoft};">${PRESTADOR.titulo}</p>
    </td></tr>`;

  const cierreTexto = [
    '',
    llegadaTexto,
    `Sala de espera: ${CONTACTO.doxyUrl}`,
    '',
    dudasTexto,
    '',
    PRESTADOR.nombreCorto,
    PRESTADOR.titulo,
    'psicologojuanfernandez.cl',
  ];

  // ---------------- Documento ----------------

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(asunto)}</title></head>
<body style="margin:0;padding:0;background-color:${C.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.cream};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${C.cream};border-radius:14px;overflow:hidden;">
        <tr><td style="background-color:${C.sage};padding:26px 32px;">
          <p style="margin:0;font-family:${FUENTE_TITULO};font-size:22px;font-weight:bold;color:${C.cream};">${PRESTADOR.nombreCorto}</p>
          <p style="margin:4px 0 0;font-family:${FUENTE_CUERPO};font-size:13px;letter-spacing:0.08em;color:${C.sageLight};text-transform:uppercase;">${PRESTADOR.titulo}</p>
        </td></tr>

        <tr><td style="padding:28px 32px 4px;">${introHtml}</td></tr>

        ${consentimientoHtml}
        ${pagoHtml}
        ${cierreHtml}

        <tr><td style="background-color:${C.sageDark};padding:16px 32px;">
          <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:12px;line-height:1.5;color:rgba(246,241,232,0.7);">psicologojuanfernandez.cl · Atención online por videollamada certificada por Fonasa.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const texto = [...introTexto, ...consentimientoTexto, ...pagoTexto, ...cierreTexto].join('\n');

  return { asunto, html, texto };
}


/* ===========================================================================
 * PARTE 2: webhook (validacion, decision de consentimiento, envio)
 * ======================================================================== */

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
  // Sonda de version. Sin esto no hay forma de saber desde fuera si un deploy
  // actualizo la funcion: la unica alternativa era reservar de verdad y mirar el
  // correo que llegaba. No expone nada, solo la revision y el catalogo de slugs.
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        funcion: 'cal-webhook',
        revision: REVISION,
        slugs: Object.keys(CATALOGO),
      }),
    };
  }

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
