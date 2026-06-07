import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Registro del service worker. Habilita el respaldo offline y la instalabilidad
// como PWA, requisito para empaquetar el sitio como app Android (TWA). El SW no
// cachea contenido dinamico, asi que el sitio sigue mostrando su version en vivo.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

