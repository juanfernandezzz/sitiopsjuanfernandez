/**
 * Configuración de los 4 tipos de evento en Cal.com, vía API v2.
 *
 * Aplica la segmentación de bandas decidida en C49:
 *
 *   dias 0 a 5    solo ingreso (primera sesion y particular)
 *   dias 5 a 14   ingreso y continuidad
 *   dias 14 a 30  solo continuidad
 *
 * El mecanismo es el aviso mínimo diferenciado: si el evento de avance exige 5
 * días de anticipación, los próximos 5 días quedan disponibles únicamente para
 * ingreso. No se bloquea nada en el calendario. Un bloqueo de Google Calendar es
 * ciego al tipo de evento y bloquearía los cuatro por igual, así que no sirve
 * para reservar cupos de ingreso.
 *
 * Los avisos mínimos de ingreso salen del flujo de pago real, no de una regla
 * comercial: el bono Fonasa hay que comprarlo antes de la sesión (24 horas), el
 * particular se paga por transferencia después (4 horas).
 *
 * GARANTIAS
 *   - No existe una sola llamada DELETE en este archivo.
 *   - Antes de tocar nada, guarda la configuración actual de los 4 eventos en
 *     scripts/respaldo-cal-<fecha>.json, versionado en el repo.
 *   - Después de aplicar, vuelve a leer y verifica campo por campo. Si algo no
 *     quedó como se pidió, sale con código 1 y lo dice.
 *
 * USO
 *   CAL_API_KEY=... node scripts/configurar-cal.mjs
 *   CAL_API_KEY=... node scripts/configurar-cal.mjs --aplicar
 *
 * Sin --aplicar no escribe nada: solo lee, respalda y compara.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.cal.com/v2';
const VERSION = '2024-06-14';

const CLAVE = process.env.CAL_API_KEY;
if (!CLAVE) {
  console.error('Falta CAL_API_KEY. Créala en Cal.com > Settings > Developer > API Keys.');
  process.exit(1);
}

const APLICAR = process.argv.includes('--aplicar');

/**
 * Configuración objetivo. Los ids son los reales de la cuenta, leídos el 15 de
 * agosto de 2026. Si Cal.com los cambiara, este script falla al leer y no
 * escribe nada.
 *
 * minimumBookingNotice va en MINUTOS.
 * periodDays es la ventana futura móvil en días naturales.
 * bookingLimitsCount limita reservas por período.
 */
const OBJETIVO = [
  {
    id: 5776252,
    nombre: 'Primera sesión Fonasa',
    slug: 'primera-sesion-bonofonasa',
    cambios: {
      minimumBookingNotice: 24 * 60,
      periodType: 'ROLLING',
      periodDays: 14,
      periodCountCalendarDays: true,
      bookingLimitsCount: { week: 3 },
    },
  },
  {
    id: 5785503,
    nombre: 'Particular',
    slug: 'psicoterapia-individual-online-particular',
    cambios: {
      minimumBookingNotice: 4 * 60,
      periodType: 'ROLLING',
      periodDays: 14,
      periodCountCalendarDays: true,
      bookingLimitsCount: { week: 3 },
    },
  },
  {
    id: 5785345,
    nombre: 'Control y avance Fonasa',
    slug: 'sesiones-de-avance-bonofonasa',
    cambios: {
      minimumBookingNotice: 5 * 24 * 60,
      periodType: 'ROLLING',
      periodDays: 30,
      periodCountCalendarDays: true,
    },
  },
  {
    id: 5785464,
    nombre: 'Pareja Fonasa',
    slug: 'psicoterapia-de-pareja-bonofonasa',
    cambios: {
      minimumBookingNotice: 24 * 60,
      periodType: 'ROLLING',
      periodDays: 14,
      periodCountCalendarDays: true,
    },
  },
];

const cabeceras = {
  Authorization: `Bearer ${CLAVE}`,
  'cal-api-version': VERSION,
  'Content-Type': 'application/json',
};

async function leer(id) {
  const r = await fetch(`${API}/event-types/${id}`, { headers: cabeceras });
  if (!r.ok) throw new Error(`Lectura de ${id} falló con ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data ?? j;
}

async function escribir(id, cambios) {
  const r = await fetch(`${API}/event-types/${id}`, {
    method: 'PATCH',
    headers: cabeceras,
    body: JSON.stringify(cambios),
  });
  if (!r.ok) throw new Error(`Escritura de ${id} falló con ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data ?? j;
}

function comparar(actual, esperado, ruta = '') {
  const fallas = [];
  for (const [k, v] of Object.entries(esperado)) {
    const a = actual?.[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      fallas.push(...comparar(a, v, `${ruta}${k}.`));
    } else if (String(a) !== String(v)) {
      fallas.push(`${ruta}${k}: esperado ${v}, encontrado ${a}`);
    }
  }
  return fallas;
}

async function main() {
  console.log(APLICAR ? 'Modo APLICAR.' : 'Modo verificación. No se escribe nada.');

  const respaldo = {};
  for (const e of OBJETIVO) {
    respaldo[e.id] = await leer(e.id);
    console.log(`Leído ${e.id} (${e.nombre}).`);
  }

  const marca = new Date().toISOString().slice(0, 10);
  const ruta = resolve(RAIZ, `scripts/respaldo-cal-${marca}.json`);
  writeFileSync(ruta, JSON.stringify(respaldo, null, 2), 'utf8');
  console.log(`Respaldo escrito en ${ruta}.`);

  if (!APLICAR) {
    for (const e of OBJETIVO) {
      const fallas = comparar(respaldo[e.id], e.cambios);
      console.log(
        fallas.length
          ? `${e.nombre}: pendiente\n  ${fallas.join('\n  ')}`
          : `${e.nombre}: ya conforme`
      );
    }
    return;
  }

  let errores = 0;
  for (const e of OBJETIVO) {
    await escribir(e.id, e.cambios);
    const despues = await leer(e.id);
    const fallas = comparar(despues, e.cambios);
    if (fallas.length) {
      errores += 1;
      console.error(`${e.nombre}: NO quedó como se pidió\n  ${fallas.join('\n  ')}`);
    } else {
      console.log(`${e.nombre}: aplicado y verificado.`);
    }
  }

  if (errores) {
    console.error(`\n${errores} evento(s) no quedaron conformes. El respaldo está en ${ruta}.`);
    process.exit(1);
  }
  console.log('\nLos 4 eventos quedaron conformes.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
