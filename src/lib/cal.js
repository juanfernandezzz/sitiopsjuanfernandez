/**
 * Constantes y configuración central de Cal.com.
 *
 * Cambiar el destino de los CTAs primarios es una sola línea: HERO_PRIMARY_CTA.
 * Verificado en cal.com/psicologojuanfernandez (mayo 2026).
 */

// Username
export const CAL_USERNAME = 'psicologojuanfernandez';

// Slugs reales de los 4 eventos. NO TOCAR sin verificar en cal.com.
export const CAL_EVENTS = {
  primeraSesionFonasa: 'primera-sesion-bonofonasa',
  controlAvanceFonasa: 'sesiones-de-avance-bonofonasa',
  parejaFonasa: 'psicoterapia-de-pareja-bonofonasa',
  particular15000: 'psicoterapia-individual-online-particular-15.000',
};

// Decisión CRO: qué evento dispara el CTA primario del hero/header.
// Opción A (recomendada): primera sesión Fonasa, copago $5.570 cubre ~80% del público chileno.
// Opción B: particular $15.000, sin restricción de previsión.
// Cambiar aquí propaga el cambio a todos los CTAs primarios.
export const HERO_PRIMARY_CTA = CAL_EVENTS.primeraSesionFonasa;

// CTA secundario explícito en sección Precios (C4) para usuarios sin Fonasa.
export const FALLBACK_PARTICULAR_CTA = CAL_EVENTS.particular15000;

// Namespace del embed (separa configuración de Cal por sección si se necesita).
export const CAL_NAMESPACE = 'psicojuan';

// Helper: link completo (fallback si el embed no carga).
export const calLinkFor = (slug) => `${CAL_USERNAME}/${slug}`;
export const calFullUrl = (slug) => `https://cal.com/${CAL_USERNAME}/${slug}`;

// Configuracion visual del widget, identica en web y app: una sola fuente para
// que el mismo embed se vea igual en todas las plataformas. El sitio la pasa a
// @calcom/embed-react; la app la inyecta en el HTML del embed dentro del WebView.
export const CAL_EMBED_CONFIG = { layout: 'month_view', theme: 'light' };

// HTML del embed inline de Cal para contenedores WebView (la app lo renderiza
// dentro de react-native-webview). En el sitio se usa el componente
// @calcom/embed-react; aqui se genera EL MISMO widget con el snippet oficial de
// Cal, leyendo de las mismas constantes (username, namespace y config), para que
// no se abra ningun navegador externo y la reserva quede contenida en la app.
//
// Funcion pura: solo arma una cadena de texto, sin DOM ni APIs de plataforma,
// para que este archivo siga siendo importable por el sitio y por la app.
export const calInlineEmbedHtml = (slug) => {
  const calLink = `${CAL_USERNAME}/${slug}`;
  const cfg = JSON.stringify(CAL_EMBED_CONFIG);
  const ns = CAL_NAMESPACE;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #F6F1E8; }
  #cal-inline { width: 100%; height: 100%; overflow: auto; -webkit-overflow-scrolling: touch; }
</style>
</head>
<body>
<div id="cal-inline"></div>
<script>
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "${ns}", { origin: "https://cal.com" });
Cal.ns["${ns}"]("inline", { elementOrSelector: "#cal-inline", calLink: "${calLink}", config: ${cfg} });
Cal.ns["${ns}"]("ui", ${cfg});
</script>
</body>
</html>`;
};
