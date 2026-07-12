import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { resolve } from 'path'

// C31: la config es una funcion para distinguir el build de cliente del build
// SSR del prerender. El build de cliente conserva las 6 entradas HTML de la
// MPA; el build SSR (vite build --ssr src/entry-server.jsx) usa esa unica
// entrada JS y no debe heredar las entradas HTML.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), imagetools()],
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
          },
        },
      },
}))
