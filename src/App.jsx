import { useEffect, useState, useRef, lazy, Suspense } from 'react'
// C51: fuera react-floating-whatsapp. Abria una ventana que IMITA WhatsApp
// dentro del sitio (avatar aplastado, saludo falso, campo vacio) y recien al
// escribir ahi saltaba a la app, perdiendo el mensaje prellenado. El reemplazo
// es un enlace directo a wa.me que abre la conversacion con el texto ya puesto.
// Sigue siendo lazy: solo aparece tras hacer scroll, asi que no pertenece al
// bundle critico.
const BotonWhatsAppFlotante = lazy(() => import('./components/ui/BotonWhatsAppFlotante'))
import { CAL_NAMESPACE } from './lib/cal'
import { iniciarCapturaSlug, registrarConversionReserva } from './lib/seguimiento'
import { UIProvider, useUI } from './lib/uiContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import ModuloDisponibilidad from './components/ui/ModuloDisponibilidad'

// Hero queda EAGER: es el LCP y debe renderizar de inmediato.
// El resto del cuerpo se carga lazy y solo se monta cuando se acerca al viewport
// (IntersectionObserver), lo que saca su JS y su Framer Motion del bundle inicial
// y posterga el TBT hasta que cada sección entra en pantalla.
const MotivosConsulta = lazy(() => import('./components/sections/MotivosConsulta'))
const ComoTrabajo = lazy(() => import('./components/sections/ComoTrabajo'))
const SobreMi = lazy(() => import('./components/sections/SobreMi'))
const Precios = lazy(() => import('./components/sections/Precios'))
const Agendar = lazy(() => import('./components/sections/Agendar'))
const FAQ = lazy(() => import('./components/sections/FAQ'))
// C24 fixpack: sección Respira conmigo en el inicio, justo antes de Preguntas
// frecuentes. Comparte el visor generativo con la página /respira.
const Respira = lazy(() => import('./components/sections/Respira'))
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
// C31: el build prerenderiza el HTML (SSG). En servidor las secciones se
// renderizan de inmediato (los crawlers no ejecutan JS ni disparan
// IntersectionObserver). En cliente, si la raiz ya trae contenido, se hidrata
// visible desde el primer render para que React conserve ese DOM; los chunks
// diferidos se hidratan solos al llegar (hidratacion selectiva de React 18).
// En desarrollo (raiz vacia, sin prerender) se conserva el montaje diferido
// por IntersectionObserver de C24.
const CONTENIDO_PRERRENDERIZADO =
  typeof document === 'undefined' ||
  !!document.getElementById('root')?.firstElementChild

function LazySection({ id, scrollMarginTop = '80px', minHeight, children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(CONTENIDO_PRERRENDERIZADO)

  useEffect(() => {
    if (CONTENIDO_PRERRENDERIZADO) return
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

  // C31: content-visibility auto exime a las secciones bajo el pliegue del
  // layout y del raster del primer frame. Sin esto, el primer paint rasteriza
  // la pagina completa (10+ alturas de viewport) y en render por software
  // (celulares de gama baja y los runners de PageSpeed) eso costaba segundos
  // de pantalla en blanco. contain-intrinsic-size reserva el alto estimado ya
  // calibrado en minHeight, el mismo que limitaba el CLS del montaje diferido.
  return (
    <div
      ref={ref}
      id={id}
      style={{
        scrollMarginTop,
        minHeight: visible ? undefined : minHeight,
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto',
      }}
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

  // Deep-link por hash al abrir el inicio directo en /#agendar, /#precios, etc.
  // El navegador intenta el salto nativo antes de que React monte las secciones,
  // así que cae al top. Lo reproducimos desde JS y lo sostenemos un instante: las
  // secciones lazy y el Hero terminan de fijar su alto unos frames después, por lo
  // que saltar una sola vez dejaría el destino corrido. Anulamos el
  // scroll-behavior: smooth global durante el ajuste (con smooth, reasentar cada
  // frame daría tirones). Si el usuario hace scroll, toca o teclea, soltamos el
  // control. No escuchamos hashchange a propósito: los clics de navegación dentro
  // de la página conservan el scroll suave nativo; este efecto solo actúa al cargar.
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash === '#top') return
    const raw = decodeURIComponent(hash.slice(1))
    // Anclas cuyo slug público no coincide con el id en el DOM: #dudas lleva a la
    // sección de Preguntas frecuentes (id="faq"). #como-funciona apuntaba a la
    // antigua sección de teleconsulta, hoy fusionada en Cómo trabajo: el alias
    // mantiene vivos los enlaces externos (anuncios, marcadores) sin romper nada.
    const ALIAS = { dudas: 'faq', 'como-funciona': 'como-trabajo' }
    const id = ALIAS[raw] || raw

    const root = document.documentElement
    const prevBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'

    let raf = 0
    let done = false
    const ABORT = ['wheel', 'touchmove', 'keydown', 'pointerdown']
    const release = () => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      ABORT.forEach((e) => window.removeEventListener(e, release))
      root.style.scrollBehavior = prevBehavior
    }
    ABORT.forEach((e) => window.addEventListener(e, release, { passive: true }))

    const start = performance.now()
    const step = (now) => {
      if (done) return
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ block: 'start' })
      if (now - start < 1500) raf = requestAnimationFrame(step)
      else release()
    }
    raf = requestAnimationFrame(step)

    return release
  }, [])

  useEffect(() => {
    const onScroll = () => setShowWhatsApp(window.scrollY > 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Barra fija de disponibilidad (móvil): aparece al salir del hero, se oculta
  // cuando la sección Agendar (el embed de Cal) entra en viewport. Reobserva
  // #agendar cada vez que aparece/desaparece del DOM (LazySection la monta
  // recién al acercarse el scroll).
  const [pasoElHero, setPasoElHero] = useState(false)
  const [agendarEnVista, setAgendarEnVista] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const sentinel = document.getElementById('hero-end-sentinel')
      setPasoElHero(sentinel ? sentinel.getBoundingClientRect().top < 0 : window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entries) => setAgendarEnVista(entries[0]?.isIntersecting ?? false),
      { rootMargin: '0px' }
    )
    let el = document.getElementById('agendar')
    const attach = () => {
      const nuevo = document.getElementById('agendar')
      if (nuevo && nuevo !== el) {
        obs.disconnect()
        obs.observe(nuevo)
        el = nuevo
      }
    }
    if (el) obs.observe(el)
    const t = setInterval(attach, 500)
    return () => {
      clearInterval(t)
      obs.disconnect()
    }
  }, [])

  // C27: captura el slug de la ultima sesion con la que se interactuo (clics en
  // elementos con data-cal-link), para que /cita-agendada muestre el bloque de
  // pago correcto. El slug vive solo en sessionStorage, nunca en la URL.
  useEffect(() => iniciarCapturaSlug(), [])

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
      // C27: ante una reserva exitosa, Cal navega a /cita-agendada (esa carga
      // dispara la conversion de Google Ads por URL). Una sola instancia global
      // para todos los CTAs, que comparten el namespace 'psicojuan'.
      registrarConversionReserva(cal)
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
        <LazySection id="como-trabajo" minHeight={1100}><ComoTrabajo /></LazySection>
        <LazySection id="bio" minHeight={620}><SobreMi /></LazySection>
        <LazySection id="precios" minHeight={900}><Precios /></LazySection>
        <LazySection id="agendar" minHeight={980}><Agendar /></LazySection>
        <LazySection id="respira" minHeight={760}><Respira /></LazySection>
        <LazySection id="faq" minHeight={560}><FAQ /></LazySection>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <ModalGuiaFonasa />
      </Suspense>

      <Suspense fallback={null}>
        <ModalTipoSesion open={isTipoSesionOpen} onClose={closeTipoSesionModal} />
      </Suspense>

      {pasoElHero && !agendarEnVista && (
        <ModuloDisponibilidad evento="primeraSesionFonasa" variante="barra" />
      )}

      {showWhatsApp && (
        <Suspense fallback={null}>
          <BotonWhatsAppFlotante />
        </Suspense>
      )}
    </div>
  )
}
