import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { FloatingWhatsApp } from 'react-floating-whatsapp'
import { CAL_NAMESPACE } from './lib/cal'
import { UIProvider, useUI } from './lib/uiContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'

// Hero queda EAGER: es el LCP y debe renderizar de inmediato.
// El resto del cuerpo se carga lazy y solo se monta cuando se acerca al viewport
// (IntersectionObserver), lo que saca su JS y su Framer Motion del bundle inicial
// y posterga el TBT hasta que cada sección entra en pantalla.
const MotivosConsulta = lazy(() => import('./components/sections/MotivosConsulta'))
const ComoTrabajo = lazy(() => import('./components/sections/ComoTrabajo'))
const Credenciales = lazy(() => import('./components/sections/Credenciales'))
const Precios = lazy(() => import('./components/sections/Precios'))
const ComoFuncionaOnline = lazy(() => import('./components/sections/ComoFuncionaOnline'))
const Agendar = lazy(() => import('./components/sections/Agendar'))
const FAQ = lazy(() => import('./components/sections/FAQ'))
const ModalGuiaFonasa = lazy(() => import('./components/modals/ModalGuiaFonasa'))
// C24: el modal de tipo de sesión también va lazy. Junto con el Hero y el Header
// sin Framer Motion, la librería de animación queda fuera del bundle crítico:
// solo viaja en los chunks diferidos (secciones bajo el fold y modales).
const ModalTipoSesion = lazy(() => import('./components/modals/ModalTipoSesion'))

/**
 * Envuelve una sección lazy. Monta el contenido cuando el wrapper se acerca al
 * viewport (rootMargin 300px de anticipo, para que el chunk alcance a cargar
 * antes de ser visible). Mientras no está montado reserva minHeight para limitar
 * el CLS. El `id` y el scrollMarginTop viven aquí, en el wrapper, para que los
 * enlaces ancla (#precios, #agendar, etc.) funcionen aunque la sección todavía
 * no se haya montado.
 */
function LazySection({ id, scrollMarginTop = '80px', minHeight, children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      id={id}
      style={{ scrollMarginTop, minHeight: visible ? undefined : minHeight }}
    >
      {visible ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  )
}

export default function App() {
  return (
    <UIProvider>
      <AppShell />
    </UIProvider>
  )
}

function AppShell() {
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const { isTipoSesionOpen, closeTipoSesionModal } = useUI()

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
    <div className="min-h-screen bg-cream text-ink font-sans antialiased selection:bg-terracotta/20 selection:text-ink">
      <Header />
      <main>
        <Hero />
        <LazySection minHeight={220}><MotivosConsulta /></LazySection>
        <LazySection id="como-trabajo" minHeight={720}><ComoTrabajo /></LazySection>
        <LazySection minHeight={420}><Credenciales /></LazySection>
        <LazySection id="precios" minHeight={900}><Precios /></LazySection>
        <LazySection id="como-funciona" minHeight={760}><ComoFuncionaOnline /></LazySection>
        <LazySection id="agendar" minHeight={980}><Agendar /></LazySection>
        <LazySection id="faq" minHeight={560}><FAQ /></LazySection>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <ModalGuiaFonasa />
      </Suspense>

      <Suspense fallback={null}>
        <ModalTipoSesion open={isTipoSesionOpen} onClose={closeTipoSesionModal} />
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
  )
}
