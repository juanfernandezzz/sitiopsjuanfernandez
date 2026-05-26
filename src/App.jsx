import { useEffect, useState, lazy, Suspense } from 'react'
import { getCalApi } from '@calcom/embed-react'
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

  useEffect(() => {
    (async () => {
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
    })()
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
