import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import CitaAgendadaApp from './CitaAgendadaApp.jsx'
import './index.css'

// C31: si el build prerenderizo la pagina (SSG), la raiz llega con HTML y
// React hidrata sobre ese DOM en vez de montarlo desde cero. En desarrollo
// la raiz llega vacia y se monta como antes.
const raiz = document.getElementById('root-cita-agendada')
const elemento = (
  <React.StrictMode>
    <CitaAgendadaApp />
  </React.StrictMode>
)
if (raiz.firstElementChild) {
  hydrateRoot(raiz, elemento)
} else {
  createRoot(raiz).render(elemento)
}
