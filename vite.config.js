import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { resolve } from 'path'
import { HERO_MODO_PLANILLA } from './src/lib/estadoIngreso.js'

/*
 * C54: el modo del hero tambien conmuta la cabecera de los HTML.
 *
 * El copy de las secciones sale de React y ya se resuelve en build (hero.js
 * elige la variante). Pero el <title>, la meta description y los JSON-LD viven
 * en los HTML de entrada, fuera de React, y ahi es donde estaban el copago y
 * los codigos MLE que en modo particular no deben existir: un anuncio de sesion
 * particular que muestra "$5.570" en el resultado de Google promete algo que la
 * pagina no ofrece.
 *
 * En vez de generar esos textos desde JavaScript, los DOS textos viven en el
 * HTML, cada uno entre marcas, y este plugin borra el bloque del modo que no
 * corre. Asi el HTML se sigue leyendo y editando como HTML, y no hay una
 * plantilla intermedia que mantener. El bloque se borra ANTES de que Vite
 * parsee (enforce: 'pre'), y corre igual en dev que en build.
 *
 * El JSON-LD queda con comentarios HTML dentro mientras esta en el fuente, que
 * no es JSON valido; lo que se publica si lo es, porque las marcas ya se
 * quitaron. Por eso el objeto de la oferta Fonasa incluye su coma final DENTRO
 * de la marca: al borrarse no puede dejar una coma colgando.
 */
/*
 * C58: que bloque de cabecera usa cada modo, uno por entrada y sin rama por
 * descarte. 'cerrada' usa a proposito la cabecera particular: no tiene ningun
 * CTA de reserva, solo el precio particular y la descripcion de la consulta,
 * que siguen siendo ciertos con la agenda cerrada, y nada de Fonasa. Un modo
 * que no este en la tabla rompe el build en vez de heredar una cabecera ajena.
 */
const CABECERA_POR_MODO = {
  particular: 'particular',
  fonasa: 'fonasa',
  cerrada: 'particular',
}

function modoHero() {
  const activo = CABECERA_POR_MODO[HERO_MODO_PLANILLA]
  if (!activo) {
    throw new Error(`vite.config.js: el modo del hero '${HERO_MODO_PLANILLA}' no tiene cabecera.`)
  }
  const inactivo = activo === 'fonasa' ? 'particular' : 'fonasa'
  return {
    name: 'modo-hero-html',
    enforce: 'pre',
    transformIndexHtml(html) {
      return html
        .replace(
          new RegExp(`[ \\t]*<!--modo:${inactivo}-->[\\s\\S]*?<!--/modo:${inactivo}-->\\r?\\n?`, 'g'),
          ''
        )
        .replace(
          new RegExp(`[ \\t]*<!--/?modo:${activo}-->\\r?\\n?`, 'g'),
          ''
        )
    },
  }
}

// C31: la config es una funcion para distinguir el build de cliente del build
// SSR del prerender. El build de cliente conserva las entradas HTML de la MPA;
// el build SSR (vite build --ssr src/entry-server.jsx) usa esa unica entrada JS
// y no debe heredar las entradas HTML.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [modoHero(), react(), imagetools()],
  // react-signature-canvas es CommonJS y su interop de default falla cuando el
  // build SSR lo deja externalizado: se agrupa dentro del bundle de servidor.
  ssr: {
    noExternal: ['react-signature-canvas'],
  },
  build: isSsrBuild
    ? {}
    : {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            consentimiento: resolve(__dirname, 'consentimiento.html'),
            asentimiento: resolve(__dirname, 'asentimientoinformado.html'),
            politica: resolve(__dirname, 'politica-privacidad.html'),
            respira: resolve(__dirname, 'respira.html'),
            citaAgendada: resolve(__dirname, 'cita-agendada.html'),
            guiaBono: resolve(__dirname, 'guia-bono-fonasa.html'),
          },
        },
      },
}))
