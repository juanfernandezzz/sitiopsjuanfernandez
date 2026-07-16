/**
 * Plumbing de seguimiento de conversiones del SITIO (no se sincroniza a la app:
 * la app no usa la etiqueta de Google; su flujo de exito vive en el WebView de
 * /reservar y la pantalla nativa cita-agendada).
 *
 * Que resuelve:
 *   1. La conversion de Google Ads se mide por carga de pagina: cuando alguien
 *      reserva, lo llevamos a /cita-agendada y esa carga dispara la conversion
 *      via la etiqueta de Google instalada en el <head> de esa pagina. No hace
 *      falta snippet de evento ni etiqueta AW por separado.
 *      Ref: https://support.google.com/google-ads/answer/12215519
 *   2. El payload del evento de Cal es fragil y su forma cambia entre versiones,
 *      asi que NO derivamos el tipo de sesion del payload. En su lugar guardamos
 *      el ultimo slug con el que la persona interactuo (clic en cualquier control
 *      con data-cal-link, o seleccion de pestana en Agendar) en sessionStorage,
 *      y la pagina de confirmacion lo lee para mostrar el bloque de pago correcto.
 *      Si no hay slug, la pagina muestra ambas vias de pago (degradacion segura).
 *      Ref embed events: https://cal.com/help/embedding/embed-events
 *
 * Privacidad: el slug NUNCA viaja en la URL ni se envia a Google. La URL de
 * confirmacion es limpia (/cita-agendada). El tipo de sesion se resuelve solo
 * en el cliente desde sessionStorage. Coherente con la politica de privacidad y
 * con la politica de salud de Google (no enviar datos sensibles a la medicion).
 */

// Identificador de la etiqueta de Google (mismo de la cuenta de Ads/Analytics).
// La configuracion gtag vive en el <head> de index.html, respira.html y
// cita-agendada.html; aqui se usa solo para el evento GA4 de la confirmacion.
export const GOOGLE_TAG_ID = 'G-RWPN108JJE';

const CLAVE_SLUG = 'cita:slug';
const CLAVE_OK = 'cita:ok';

const leer = (k) => {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
};
const escribir = (k, v) => {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    /* sessionStorage no disponible: seguimos sin romper el flujo */
  }
};
const borrar = (k) => {
  try {
    window.sessionStorage.removeItem(k);
  } catch {
    /* no-op */
  }
};

// Extrae el slug ('username/slug' -> 'slug') de un atributo data-cal-link.
const slugDeCalLink = (link) => (link ? link.split('/').slice(1).join('/') : '');

/**
 * Registra un listener en fase de captura sobre el documento: cada clic en un
 * elemento (o ancestro) con data-cal-link guarda su slug. Cubre el CTA del hero,
 * el menu del header, los botones de Precios, el modal de tipo de sesion y el
 * boton movil de Agendar. Devuelve la funcion de limpieza.
 */
export function iniciarCapturaSlug() {
  if (typeof document === 'undefined') return () => {};
  const alClic = (ev) => {
    const t = ev.target;
    const el = t && t.closest ? t.closest('[data-cal-link]') : null;
    if (!el) return;
    const slug = slugDeCalLink(el.getAttribute('data-cal-link'));
    if (slug) escribir(CLAVE_SLUG, slug);
  };
  document.addEventListener('click', alClic, true);
  return () => document.removeEventListener('click', alClic, true);
}

// Guarda explicitamente un slug (lo usa el embed inline de escritorio en
// Agendar, donde la reserva ocurre dentro del iframe y no hay clic con
// data-cal-link que capturar).
export function recordarSlug(slug) {
  if (slug) escribir(CLAVE_SLUG, slug);
}

/**
 * Registra los listeners de Cal que, ante una reserva exitosa, marcan la
 * bandera y navegan a /cita-agendada (navegacion completa = carga de pagina =
 * conversion de Ads). Escucha los dos nombres de evento porque bookingSuccessful
 * quedo deprecado por bookingSuccessfulV2 y conviven segun version del embed.
 * Un candado evita doble navegacion si ambos disparan.
 *
 * `cal` es la instancia devuelta por getCalApi (la misma con la que el sitio ya
 * llama cal('ui', ...) en App.jsx).
 */
export function registrarConversionReserva(cal) {
  if (typeof cal !== 'function') return;
  let yaRedirigido = false;
  const alReservar = () => {
    if (yaRedirigido) return;
    yaRedirigido = true;
    escribir(CLAVE_OK, '1');
    window.location.assign('/cita-agendada');
  };
  cal('on', { action: 'bookingSuccessful', callback: alReservar });
  cal('on', { action: 'bookingSuccessfulV2', callback: alReservar });
}

/**
 * Lee el contexto de la reserva en la pagina de confirmacion. Devuelve el slug
 * guardado (o null) y si la llegada fue una reserva real (bandera puesta antes
 * de redirigir). Tras leer, limpia el slug para no arrastrarlo a futuras visitas.
 */
export function contextoConfirmacion() {
  const slug = leer(CLAVE_SLUG);
  const esReservaReal = leer(CLAVE_OK) === '1';
  borrar(CLAVE_SLUG);
  return { slug, esReservaReal };
}

/**
 * Dispara el evento GA4 'cita_agendada' una sola vez, solo si la llegada fue una
 * reserva real (bandera). Asi el evento no se ensucia con visitas directas a la
 * URL. El page_view automatico y la conversion por URL de Ads ocurren igual via
 * la etiqueta del <head>; este evento es para el reporte propio de GA4.
 */
export function dispararEventoCita() {
  if (leer(CLAVE_OK) !== '1') return;
  borrar(CLAVE_OK);
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'cita_agendada', { send_to: GOOGLE_TAG_ID });
    }
  } catch {
    /* sin gtag cargado: la conversion por URL ya quedo cubierta */
  }
  // C37: mismo evento hacia Umami (medicion sin cookies). Si su script aun
  // no carga (llega tras window.load), el evento queda en la cola que el
  // loader del <head> vacia al terminar de cargar.
  try {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track('cita_agendada');
    } else if (Array.isArray(window.umamiCola)) {
      window.umamiCola.push('cita_agendada');
    }
  } catch {
    /* sin Umami disponible: la medicion de Google ya cubrio la conversion */
  }
}
