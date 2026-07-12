import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// C31: si el build prerenderizo la pagina (SSG), la raiz llega con HTML y
// React hidrata sobre ese DOM en vez de montarlo desde cero. En desarrollo
// la raiz llega vacia y se monta como antes.
const raiz = document.getElementById('root')
const elemento = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
if (raiz.firstElementChild) {
  hydrateRoot(raiz, elemento)
} else {
  createRoot(raiz).render(elemento)
}

// Registro del service worker. Habilita el respaldo offline y la instalabilidad
// como PWA, requisito para empaquetar el sitio como app Android (TWA). El SW no
// cachea contenido dinamico, asi que el sitio sigue mostrando su version en vivo.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

