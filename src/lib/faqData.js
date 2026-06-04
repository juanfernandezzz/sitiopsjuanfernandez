/**
 * Single source de verdad para las 10 Q&A del FAQ.
 *
 * Consumido por:
 *   - src/components/sections/FAQ.jsx (UI)
 *   - JSON-LD FAQPage hardcodeado en index.html (SEO)
 *
 * MANTENIMIENTO: si editas este archivo, actualiza también el JSON-LD
 * FAQPage en index.html para mantener consistencia schema/contenido.
 * Drift entre ambos no rompe el sitio pero invalida rich snippets en Google.
 */
export const FAQ_ITEMS = [
  {
    q: '¿Cómo saber si la terapia es para mí?',
    a: 'Si llevas más de un par de semanas con algo que te incomoda: ansiedad, tristeza, una decisión difícil, una sensación que no logras nombrar. Vale la pena conversarlo. La primera sesión es para conocernos y entender juntos qué te trae. Si después no quieres continuar, no hay compromiso.',
  },
  {
    q: '¿La terapia online funciona igual que la presencial?',
    a: 'Sí, para la mayoría de los procesos que llegan a consulta. Varios metaanálisis que reúnen cientos de estudios concluyen que la terapia por videollamada logra resultados equivalentes a la presencial, y que el beneficio es especialmente claro en ansiedad y depresión cuando se trabaja con terapia cognitivo-conductual. Lo importante es que tengas un lugar privado donde hablar tranquilo y una conexión estable. Hay situaciones específicas en las que recomiendo terapia presencial. Si fuera tu caso, te lo diría con honestidad.',
    fuentes: [
      {
        label: 'Greenwood et al. (2020), Clinical Psychology Review',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S027273582030132X',
      },
      {
        label: 'Fernandez et al. (2021), Clinical Psychology & Psychotherapy',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33826190/',
      },
      {
        label: 'Revisión global (2024), Computers in Human Behavior',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0747563224001936',
      },
    ],
  },
  {
    q: '¿Cuánto cuesta una sesión?',
    a: 'Hay dos modalidades: sesión particular por $15.000, o sesión con bono Fonasa por $5.570 (este último disponible para afiliados Fonasa de tramos B, C y D, bajo los códigos 09 08 101, 09 08 102 y 09 08 103). Misma duración y dedicación en ambos casos. La forma de pago no cambia lo que pasa en la sesión.',
  },
  {
    q: '¿Cómo compro un bono Fonasa?',
    a: 'Puedes comprarlo online desde Mi Fonasa con tu ClaveÚnica, o presencial en sucursales Fonasa, Caja Los Andes, Caja Los Héroes, ChileAtiende y Servipag. Lo importante: compra el bono ANTES de la sesión y envíame el folio por WhatsApp para validarlo.',
    cta: { label: 'Ver guía paso a paso →', action: 'openFonasaModal' },
  },
  {
    q: '¿Qué pasa en la primera sesión?',
    a: 'Nos conocemos. Me cuentas qué te trae, con el detalle que tú quieras dar, sin presión. Te explico cómo trabajo. Exploramos qué necesitas. Si al final de los 45 minutos sentimos que tiene sentido seguir, definimos un plan. Si no, también está bien.',
  },
  {
    q: '¿Necesito instalar algo para la videollamada?',
    a: 'No. Las sesiones son a través de Doxy.me, plataforma de teleconsulta certificada por Fonasa. Se abre desde cualquier navegador moderno (Chrome, Safari, Firefox, Edge). Recibes un link, le das clic, das permiso a cámara y micrófono, y entras a la sala de espera. Yo te admito cuando estoy listo.',
  },
  {
    q: '¿Mis datos están protegidos?',
    a: 'Sí. La plataforma de videollamadas está certificada por Fonasa y la conexión va cifrada. No grabo las sesiones. La ficha clínica se mantiene bajo los mismos estándares que una atención presencial, conforme a la Ley 21.541 de telemedicina y a la normativa de protección de datos vigente en Chile.',
  },
  {
    q: '¿Con qué frecuencia se hacen las sesiones?',
    a: 'Lo habitual es semanal o quincenal, según el momento del proceso. Lo conversamos en la segunda sesión y lo ajustamos a tu ritmo y posibilidades.',
  },
  {
    q: '¿Puedo cancelar o reagendar?',
    a: 'Sí. Puedes reagendar desde el mismo email de confirmación hasta 6 horas antes de la sesión sin costo. Cancelaciones con menos de 6 horas se reagendan caso a caso.',
  },
  {
    q: '¿Qué pasa si tengo una crisis fuera del horario de sesión?',
    a: 'Las sesiones son agendadas y no funciono como servicio de urgencia. Si estás en riesgo o tienes una crisis fuera de horario, por favor contacta Salud Responde 600 360 7777 (gratuito, 24/7) o acude a la urgencia más cercana. En la siguiente sesión podemos trabajar lo que ocurrió.',
  },
];
