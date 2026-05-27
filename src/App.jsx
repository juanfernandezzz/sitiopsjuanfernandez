import { useEffect, useState, lazy, Suspense } from 'react'
import { FloatingWhatsApp } from 'react-floating-whatsapp'
import { CAL_NAMESPACE } from './lib/cal'
import { UIProvider } from './lib/uiContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import ComoTrabajo from './components/sections/ComoTrabajo'
import Precios from './components/sections/Precios'
import ComoFuncionaOnline from './components/sections/ComoFuncionaOnline'
import Agendar from './components/sections/Agendar'
import FAQ from './components/sections/FAQ'

const ModalGuiaFonasa = lazy(() => import('./components/modals/ModalGuiaFonasa'))

export default function App() {
  const [showWhatsApp, setShowWhatsApp] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowWhatsApp(window.scrollY > 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cal.com se carga al primer evento de interacción del usuario. El dynamic
  // import saca @calcom/embed-react del chunk principal y el listener once:true
  // garantiza una sola inicialización. Si un usuario clickea un CTA antes de
  // que Cal cargue, el Button (src/components/ui/Button.jsx) tiene fallback a
  // window.open(cal.com) en pestaña nueva, así que la ruta de booking nunca
  // queda inerte.
  useEffect(() => {
    let loaded = false
    const loadCal = async () => {
      if (loaded) return
      loaded = true
      const { getCalApi } = await import('@calcom/embed-react')
      const cal = await getCalApi({ namespace: CAL_NAMESPACE })
      cal('ui', {
        hideEventTypeDetails: false,
        layout: 'month_view',
        theme: 'light',
        cssVarsPerTheme: {
          light: {
            'cal-brand': '#3F5B4A',
            'cal-brand-emphasis': '#2F4538',
            'cal-text': '#2A3B4C',
            'cal-bg': '#FFFDF8',
          },
        },
      })
      cleanup()
    }
    const events = ['click', 'scroll', 'touchstart', 'keydown']
    const cleanup = () => events.forEach(e => window.removeEventListener(e, loadCal))
    events.forEach(e => window.addEventListener(e, loadCal, { passive: true, once: true }))
    return cleanup
  }, [])

  return (
    <UIProvider>
      <div className="min-h-screen bg-cream text-ink font-sans antialiased selection:bg-terracotta/20 selection:text-ink">
        <Header />
        <main>
          <Hero />
          <ComoTrabajo />
          <Precios />
          <ComoFuncionaOnline />
          <Agendar />
          <FAQ />
        </main>

        <Footer />

        <Suspense fallback={null}>
          <ModalGuiaFonasa />
        </Suspense>

        {showWhatsApp && (
          <FloatingWhatsApp
            phoneNumber="56973394530"
            accountName="Juan Fernández"
            statusMessage="Psicólogo clínico · Responde habitualmente en pocas horas"
            chatMessage="Hola, gracias por escribir. ¿En qué puedo acompañarte?"
            placeholder="Escribe tu mensaje..."
            avatar="/juan.jpg"
            notification={false}
            allowClickAway
            allowEsc
          />
        )}
      </div>
    </UIProvider>
  )
}
