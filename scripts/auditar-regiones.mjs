/**
 * Auditoria geografica y estacional.
 *
 * La region y el mes no afectan a las particulas: afectan a la posicion del
 * sol, a la fase y altura de la luna, al cielo estrellado y por lo tanto a la
 * paleta. Todo eso es numerico, asi que se puede verificar de forma exhaustiva
 * sin rasterizar, que es varios ordenes de magnitud mas barato.
 *
 * El render se audita aparte, por dispositivo, en auditar-dispositivos.mjs.
 *
 * Cubre las 16 regiones continentales. Se excluyen Rapa Nui y la Antartica
 * Chilena por decision de alcance.
 */
import { construirEscena, paletaFondo, luminancia, contraste } from '../src/lib/escena.js'
import { estrellasVisibles, trazosVisibles } from '../src/lib/estrellas.js'

const REGIONES = [
  ['Arica y Parinacota', -18.48, -70.31], ['Tarapaca', -20.21, -70.15],
  ['Antofagasta', -23.65, -70.4], ['Atacama', -27.37, -70.33],
  ['Coquimbo', -29.9, -71.25], ['Valparaiso', -33.05, -71.62],
  ['Metropolitana', -33.45, -70.67], ["O'Higgins", -34.17, -70.74],
  ['Maule', -35.43, -71.67], ['Nuble', -36.61, -72.1],
  ['Biobio', -36.83, -73.05], ['Araucania', -38.74, -72.6],
  ['Los Rios', -39.81, -73.25], ['Los Lagos', -41.47, -72.94],
  ['Aysen', -45.57, -72.07], ['Magallanes', -53.16, -70.91],
]
const CIELOS = {
  clearsky: [0.02, 0, 0, 0.06], partlycloudy: [0.52, 0.38, 0.26, 0.2],
  cloudy: [0.95, 0.9, 0.62, 0.26], fog: [0.9, 0.9, 0.22, 0.05],
  heavyrain: [1, 0.95, 0.86, 0.3], heavysnow: [1, 0.95, 0.8, 0.3],
}
const MM = { heavyrain: 5, heavysnow: 4 }
const TEMPS = [-20, 6, 34]

let n = 0
const fallos = []
let minCon = Infinity, minConCaso = ''
let maxAlt = -99, minAlt = 99
let totalEstrellas = 0, conCruz = 0, nochesEval = 0

for (const [reg, lat, lon] of REGIONES) {
  for (let mes = 0; mes < 12; mes++) {
    for (let h = 0; h < 24; h++) {
      for (const cielo of Object.keys(CIELOS)) {
        for (const temp of TEMPS) {
          const [tot, baja, media, alta] = CIELOS[cielo]
          const mm = MM[cielo] || 0
          const f = new Date(Date.UTC(2026, mes, 15, 0, 0, 0))
          f.setUTCMinutes(h * 60 - (lon / 15) * 60)
          const e = construirEscena({
            ok: true, lat, lon, simbolo: cielo,
            nubes: { total: tot, baja, media, alta },
            aire: { temp, humedad: cielo === 'fog' ? 0.96 : mm ? 0.92 : 0.6,
                    presion: mm > 2 ? 996 : 1015, rocio: cielo === 'fog' ? temp - 0.4 : temp - 7 },
            niebla: cielo === 'fog' ? 0.8 : 0, uv: temp > 26 ? 10 : 3,
            viento: { vel: 10, dir: 280 }, precip: { mm },
          }, f)
          const p = paletaFondo(e)
          n++

          const etq = `${reg}/m${mes + 1}/${h}h/${cielo}/${temp}C`
          for (const [k, v] of [['astro.x', e.astro.x], ['astro.y', e.astro.y],
                                ['luz', e.luz], ['temperatura', e.temperatura],
                                ['viento.deriva', e.viento.deriva], ['opacidadVelo', p.opacidadVelo]]) {
            if (!Number.isFinite(v)) fallos.push(`${etq}: ${k} no finito`)
          }
          if (e.astro.x < 0 || e.astro.x > 1 || e.astro.y < 0 || e.astro.y > 1) {
            fallos.push(`${etq}: astro fuera de rango`)
          }
          if (/NaN|undefined/.test(p.cenit + p.horizonte + p.texto + p.vegetacionColor)) {
            fallos.push(`${etq}: color invalido`)
          }
          if (p.contrastePeor < 7) fallos.push(`${etq}: contraste ${p.contrastePeor.toFixed(2)}`)
          if (p.contrastePeor < minCon) { minCon = p.contrastePeor; minConCaso = etq }
          if (e.astro.altitud > maxAlt) maxAlt = e.astro.altitud
          if (e.astro.altitud < minAlt) minAlt = e.astro.altitud

          if (cielo === 'clearsky' && temp === 6 && p.polaridad === 'oscuro') {
            nochesEval++
            const vis = estrellasVisibles(f, lat, lon, 2.9)
            totalEstrellas += vis.length
            if (trazosVisibles(vis).length > 0) conCruz++
          }
        }
      }
    }
  }
}

console.log('-'.repeat(60))
console.log(`Combinaciones: ${n.toLocaleString('es')}`)
console.log(`  16 regiones continentales x 12 meses x 24 horas x 6 cielos x 3 temperaturas`)
console.log('-'.repeat(60))
console.log(`Contraste minimo: ${minCon.toFixed(2)}:1  en ${minConCaso}`)
console.log(`Altitud solar/lunar: de ${minAlt.toFixed(1)} a ${maxAlt.toFixed(1)} grados`)
console.log(`Noches despejadas evaluadas: ${nochesEval}`)
console.log(`  estrellas promedio por noche: ${(totalEstrellas / Math.max(1, nochesEval)).toFixed(1)}`)
console.log(`  noches con constelacion trazada: ${((100 * conCruz) / Math.max(1, nochesEval)).toFixed(0)}%`)
console.log('-'.repeat(60))
console.log(`FALLOS: ${fallos.length}`)
fallos.slice(0, 10).forEach((f) => console.log('  >> ' + f))
console.log(fallos.length ? 'AUDITORIA CON FALLOS' : 'AUDITORIA SUPERADA: 16 regiones, 12 meses, 24 horas')
process.exit(fallos.length ? 1 : 0)
