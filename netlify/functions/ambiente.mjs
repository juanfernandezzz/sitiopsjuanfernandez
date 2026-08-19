import { getStore } from '@netlify/blobs'

/**
 * Ambiente: entrega el estado atmosferico aproximado del visitante
 * para alimentar la escena ambiental del sitio.
 *
 * Privacidad:
 * - La ubicacion se deriva de la IP en el borde (context.geo). No se almacena la IP.
 * - Las coordenadas se redondean a celdas de 0.25 grados (unos 28 km) antes de
 *   salir de esta funcion. Esa celda es la unica clave de cache.
 * - No se devuelve ciudad, region ni codigo postal al navegador.
 *
 * Fuente: MET Norway Locationforecast 2.0 (CC BY 4.0).
 * Requiere User-Agent identificable con contacto, segun sus terminos de servicio.
 */

const MET_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/complete'
const USER_AGENT = 'psicologojuanfernandez.cl/1.0 (juanfernandezpsicologo@gmail.com)'
const CELDA = 0.25
const TTL_MIN = 60 * 60 * 1000
const TTL_MAX = 6 * 60 * 60 * 1000

const redondea = (n) => Math.round(n / CELDA) * CELDA
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const pct = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v / 100)) : null)

function respuesta(cuerpo, maxAge) {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAge}`,
      'netlify-vary': 'query',
    },
  })
}

/** Extrae el bloque horario vigente del GeoJSON de MET. */
function normaliza(json, lat, lon) {
  const serie = json?.properties?.timeseries
  if (!Array.isArray(serie) || serie.length === 0) return null

  const ahora = Date.now()
  let punto = serie[0]
  for (const p of serie) {
    if (new Date(p.time).getTime() <= ahora) punto = p
    else break
  }

  const d = punto?.data?.instant?.details || {}
  const h1 = punto?.data?.next_1_hours || null
  const h6 = punto?.data?.next_6_hours || null
  const periodo = h1 || h6

  return {
    ok: true,
    fuente: 'met',
    obs: punto.time,
    lat,
    lon,
    aire: {
      temp: num(d.air_temperature),
      presion: num(d.air_pressure_at_sea_level),
      humedad: pct(d.relative_humidity),
      rocio: num(d.dew_point_temperature),
    },
    nubes: {
      total: pct(d.cloud_area_fraction),
      baja: pct(d.cloud_area_fraction_low),
      media: pct(d.cloud_area_fraction_medium),
      alta: pct(d.cloud_area_fraction_high),
    },
    niebla: pct(d.fog_area_fraction),
    uv: num(d.ultraviolet_index_clear_sky),
    viento: {
      vel: num(d.wind_speed),
      dir: num(d.wind_from_direction),
      racha: num(d.wind_speed_of_gust),
    },
    precip: {
      mm: num(periodo?.details?.precipitation_amount),
      prob: pct(periodo?.details?.probability_of_precipitation),
      trueno: pct(periodo?.details?.probability_of_thunder),
    },
    simbolo: periodo?.summary?.symbol_code || null,
  }
}

export default async (req, context) => {
  const geo = context?.geo || {}
  const latCruda = num(geo.latitude)
  const lonCruda = num(geo.longitude)

  // Sin geolocalizacion utilizable: degradacion silenciosa.
  // El cliente cae a cielo puro segun su zona horaria, sin datos de clima.
  if (latCruda === null || lonCruda === null) {
    return respuesta({ ok: false, motivo: 'sin-geo' }, 300)
  }

  const lat = redondea(latCruda)
  const lon = redondea(lonCruda)
  const clave = `${lat.toFixed(2)}_${lon.toFixed(2)}`

  let store = null
  try {
    store = getStore('ambiente')
  } catch {
    store = null
  }

  if (store) {
    try {
      const cache = await store.get(clave, { type: 'json' })
      if (cache && cache.expira > Date.now()) {
        return respuesta(cache.datos, 900)
      }
    } catch {
      // cache no disponible: seguimos a la fuente
    }
  }

  let datos = null
  try {
    const ctrl = new AbortController()
    const corte = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(`${MET_BASE}?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: ctrl.signal,
    })
    clearTimeout(corte)
    if (r.ok) {
      datos = normaliza(await r.json(), lat, lon)
      // MET pide respetar Expires. Lo acotamos entre 1 y 6 horas.
      const exp = Date.parse(r.headers.get('expires') || '')
      var vence = Number.isFinite(exp)
        ? Math.min(Math.max(exp, Date.now() + TTL_MIN), Date.now() + TTL_MAX)
        : Date.now() + TTL_MIN
    }
  } catch {
    datos = null
  }

  if (!datos) {
    // Ultimo recurso: cache vencida sirve mejor que nada.
    if (store) {
      try {
        const viejo = await store.get(clave, { type: 'json' })
        if (viejo?.datos) return respuesta({ ...viejo.datos, rancio: true }, 300)
      } catch {
        // sin recurso
      }
    }
    return respuesta({ ok: false, motivo: 'sin-datos', lat, lon }, 300)
  }

  if (store) {
    try {
      await store.setJSON(clave, { datos, expira: vence })
    } catch {
      // escritura opcional
    }
  }

  return respuesta(datos, 900)
}

export const config = { path: '/api/ambiente' }
