import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), imagetools()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        consentimiento: resolve(__dirname, 'consentimiento.html'),
        asentimiento: resolve(__dirname, 'asentimientoinformado.html'),
        politica: resolve(__dirname, 'politica-privacidad.html'),
      },
    },
  },
})
