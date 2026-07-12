import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { Writable } from 'node:stream'
import App from './App.jsx'
import CitaAgendadaApp from './CitaAgendadaApp.jsx'
import ConsentimientoApp from './ConsentimientoApp.jsx'
import AsentimientoApp from './AsentimientoApp.jsx'
import PoliticaPrivacidadApp from './PoliticaPrivacidadApp.jsx'
import RespiraApp from './RespiraApp.jsx'

/*
 * C31: entrada de servidor para el prerender de build (SSG).
 *
 * Los crawlers de IA (GPTBot, ClaudeBot, PerplexityBot y afines) no ejecutan
 * JavaScript: leen solo el HTML crudo. Este modulo renderiza cada pagina de la
 * MPA a HTML en tiempo de build, para que scripts/prerender.mjs inyecte ese
 * contenido dentro del div raiz de cada archivo de dist/.
 *
 * Se usa renderToPipeableStream con onAllReady (y no renderToString) porque el
 * arbol usa React.lazy y Suspense: el stream espera a que los chunks diferidos
 * resuelvan y emite el HTML completo con los marcadores de Suspense que
 * hydrateRoot necesita en el cliente para hidratar sin descartar el DOM.
 *
 * El envoltorio React.StrictMode replica exactamente el arbol de los
 * main-*.jsx del cliente: servidor y cliente deben renderizar lo mismo.
 */

const PAGINAS = {
  main: App,
  citaAgendada: CitaAgendadaApp,
  consentimiento: ConsentimientoApp,
  asentimiento: AsentimientoApp,
  politica: PoliticaPrivacidadApp,
  respira: RespiraApp,
}

export function render(clave) {
  const Componente = PAGINAS[clave]
  if (!Componente) {
    return Promise.reject(new Error(`Pagina desconocida en entry-server: ${clave}`))
  }

  return new Promise((resolve, reject) => {
    let terminado = false
    let html = ''

    const salida = new Writable({
      write(fragmento, _codificacion, continuar) {
        html += fragmento
        continuar()
      },
    })

    salida.on('finish', () => {
      terminado = true
      resolve(html)
    })

    const { pipe, abort } = renderToPipeableStream(
      <React.StrictMode>
        <Componente />
      </React.StrictMode>,
      {
        onAllReady() {
          pipe(salida)
        },
        onError(error) {
          terminado = true
          reject(error)
        },
      }
    )

    // Red de seguridad: si un chunk diferido nunca resuelve, el build falla
    // con un error claro en vez de colgarse.
    setTimeout(() => {
      if (!terminado) {
        abort()
        reject(new Error(`Timeout de prerender en la pagina: ${clave}`))
      }
    }, 30000)
  })
}
