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
// Opción A (recomendada): primera sesión Fonasa — copago $5.570 cubre ~80% del público chileno.
// Opción B: particular $15.000 — sin restricción de previsión.
// Cambiar aquí propaga el cambio a todos los CTAs primarios.
export const HERO_PRIMARY_CTA = CAL_EVENTS.primeraSesionFonasa;

// CTA secundario explícito en sección Precios (C4) para usuarios sin Fonasa.
export const FALLBACK_PARTICULAR_CTA = CAL_EVENTS.particular15000;

// Namespace del embed (separa configuración de Cal por sección si se necesita).
export const CAL_NAMESPACE = 'psicojuan';

// Helper: link completo (fallback si el embed no carga).
export const calLinkFor = (slug) => `${CAL_USERNAME}/${slug}`;
export const calFullUrl = (slug) => `https://cal.com/${CAL_USERNAME}/${slug}`;
