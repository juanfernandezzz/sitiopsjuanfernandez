import { getStore } from '@netlify/blobs';

/**
 * Disponibilidad real de Cal.com, cacheada, para el módulo del sitio y de la app.
 *
 * POR QUE UNA FUNCION Y NO UNA LLAMADA DIRECTA DESDE EL NAVEGADOR
 *   La API v2 de Cal.com exige una clave con permisos de lectura y escritura.
 *   Esa clave no puede viajar al cliente bajo ninguna circunstancia. Además, sin
 *   caché cada visita al sitio golpearía a Cal.com, lo que agota cuota y agrega
 *   latencia al hero.
 *
 * POR QUE NO SE HORNEA EN EL PRERENDER
 *   El build es autoverificable: renderiza cada página dos veces y compara bytes.
 *   Un valor que cambia entre renders rompe el guard de determinismo. Y los
 *   crawlers de IA no ejecutan JS, así que si el dato entrara al HTML estático
 *   podrían cachear un "sin cupos" indefinidamente. El dato se hidrata en cliente.
 *
 * DEGRADACION
 *   Ante cualquier fallo se sirve el último valor bueno hasta 6 horas. Pasado ese
 *   plazo se devuelve estado desconocido y el módulo desaparece de la interfaz.
 *   Nunca se devuelve un dato viejo disfrazado de fresco.
 *
 * FALLA CONOCIDA DE LA API
 *   Con ventana de reservas móvil activada, el parámetro `start` de /v2/slots
 *   ha sido reportado como ignorado: la respuesta empieza en el día de hoy sin
 *   importar lo pedido. Por eso el filtrado por fecha se rehace aquí sobre la
 *   respuesta, en vez de confiar en el rango solicitado.
 */

const API = 'https://api.cal.com/v2/slots';
const VERSION_API = '2024-09-04';
const ZONA = 'America/Santiago';

// Identificadores numéricos verificados en la cuenta el 15 de agosto de 2026.
// Si se crea o migra un evento hay que actualizarlos aquí.
const EVENTOS = {
  primeraSesionFonasa: 5776252,
  particular: 5785503,
};

// Solo estos eventos alimentan el módulo público. El de pareja está cerrado por
// decisión de negocio (bandera sinCupos en src/lib/sesiones.js) y no se consulta.
const PUBLICOS = ['primeraSesionFonasa', 'particular'];

const TTL_MS = 10 * 60 * 1000; // 10 minutos de caché fresca
const MAX_RANCIO_MS = 6 * 60 * 60 * 1000; // 6 horas sirviendo el último valor bueno
const DIAS_VENTANA = 21;

const CLAVE_CACHE = 'disponibilidad-v1';

function hoyEnSantiago() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date()); // "2026-08-15"
}

function sumarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  f.setUTCDate(f.getUTCDate() + n);
  return f.toISOString().slice(0, 10);
}

function diasEntre(desdeISO, hastaISO) {
  const [a1, m1, d1] = desdeISO.split('-').map(Number);
  const [a2, m2, d2] = hastaISO.split('-').map(Number);
  const ms = Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1);
  return Math.round(ms / 86400000);
}

/** "2026-08-24T14:00:00-04:00" -> "14:00" en la zona de Santiago. */
function horaLocal(iso) {
  const fmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return fmt.format(new Date(iso));
}

async function consultarEvento(id, clave, apiKey, hoy) {
  const url = new URL(API);
  url.searchParams.set('eventTypeId', String(id));
  url.searchParams.set('start', hoy);
  url.searchParams.set('end', sumarDias(hoy, DIAS_VENTANA));
  url.searchParams.set('timeZone', ZONA);

  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': VERSION_API,
    },
  });
  if (!r.ok) throw new Error(`Cal.com ${clave} respondió ${r.status}`);

  const json = await r.json();
  const data = json && json.data ? json.data : null;
  if (!data || typeof data !== 'object') throw new Error(`Cal.com ${clave} sin data`);

  // data llega como { "2026-08-24": [ { start: "..." }, ... ], ... }.
  // Se rehace el filtro por fecha aquí por la falla conocida del parámetro start.
  const dias = Object.keys(data)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= hoy)
    .filter((d) => Array.isArray(data[d]) && data[d].length > 0)
    .sort();

  if (dias.length === 0) return { estado: 'desconocido' };

  const primero = dias[0];
  const horas = data[primero]
    .map((s) => (s && s.start ? horaLocal(s.start) : null))
    .filter(Boolean)
    .sort();

  // Cupos dentro de los próximos 7 días, que es lo que el módulo llama "esta semana".
  const limiteSemana = sumarDias(hoy, 7);
  const cuposSemana = dias
    .filter((d) => d <= limiteSemana)
    .reduce((n, d) => n + data[d].length, 0);

  const diasHasta = diasEntre(hoy, primero);

  return {
    estado: 'ok',
    fechaISO: primero,
    horas,
    diasHasta,
    cuposSemana,
    alerta: diasHasta > 4,
  };
}

export default async function handler() {
  const cabeceras = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };

  const store = getStore('disponibilidad');
  const apiKey = process.env.CAL_API_KEY;

  let cache = null;
  try {
    cache = await store.get(CLAVE_CACHE, { type: 'json' });
  } catch {
    cache = null;
  }

  const ahora = Date.now();
  if (cache && ahora - cache.ts < TTL_MS) {
    return new Response(JSON.stringify(cache.payload), { headers: cabeceras });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ eventos: {}, motivo: 'sin-clave' }), {
      headers: cabeceras,
    });
  }

  try {
    const hoy = hoyEnSantiago();
    const entradas = await Promise.all(
      PUBLICOS.map(async (clave) => [
        clave,
        await consultarEvento(EVENTOS[clave], clave, apiKey, hoy),
      ])
    );

    const eventos = {};
    for (const [clave, valor] of entradas) {
      if (valor.estado === 'ok') eventos[clave] = valor;
    }

    const payload = { generadoEn: new Date().toISOString(), hoy, eventos };
    await store.setJSON(CLAVE_CACHE, { ts: ahora, payload });
    return new Response(JSON.stringify(payload), { headers: cabeceras });
  } catch (err) {
    // Cal.com falló. Si el último valor bueno todavía es defendible, se sirve.
    if (cache && ahora - cache.ts < MAX_RANCIO_MS) {
      return new Response(JSON.stringify({ ...cache.payload, rancio: true }), {
        headers: cabeceras,
      });
    }
    return new Response(JSON.stringify({ eventos: {}, motivo: 'error' }), {
      headers: cabeceras,
    });
  }
}
