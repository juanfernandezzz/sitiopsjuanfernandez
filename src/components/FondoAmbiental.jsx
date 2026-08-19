import { useEffect, useRef, useState, useMemo } from 'react'
import { construirEscena, paletaFondo } from '../lib/escena.js'
import { crearMotor } from '../lib/motorEscena.js'

/**
 * Fondo ambiental.
 *
 * Envuelve una seccion de contenido y le da como fondo el estado del cielo
 * real del visitante. Sin texto propio, sin botones, sin permisos.
 *
 * Todo el render vive en src/lib/motorEscena.js. Este componente solo
 * conecta React con el motor: mide, pide datos, marca la caja de texto y
 * corre el bucle. Antes tenia una copia propia del render que quedo
 * desactualizada respecto del motor, con el resultado de que lo verificado
 * y lo desplegado eran cosas distintas.
 */

const OBJETIVO_MS = 1000 / 30

export default function FondoAmbiental({ children, className = '' }) {
  const contenedor = useRef(null)
  const canvasRef = useRef(null)
  const contenidoRef = useRef(null)
  const motorRef = useRef(null)

  const [visible, setVisible] = useState(false)
  const [revelado, setRevelado] = useState(false)
  const [clima, setClima] = useState(null)
  const [ahora, setAhora] = useState(() => new Date())

  const reducido = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const nativo = useMemo(() => {
    if (typeof window === 'undefined' || !window.CSS || !CSS.supports) return false
    return CSS.supports('animation-timeline', 'view()')
  }, [])

  const escena = useMemo(() => construirEscena(clima, ahora), [clima, ahora])
  const paleta = useMemo(() => paletaFondo(escena), [escena])

  // Referencias vivas a la escena. El motor se destruye al salir de viewport
  // y se vuelve a crear al entrar, pero el efecto que le entrega la escena
  // depende de [escena, paleta, ahora]: si esos valores no cambiaron entre
  // medias, no se dispara, y el motor nuevo se queda sin escena. Entonces
  // cuadro() retorna de inmediato y solo se ve el degradado CSS.
  // Ese era el fondo que quedaba estatico tras desplazarse un rato.
  const escenaRef = useRef(escena)
  const paletaRef = useRef(paleta)
  const ahoraRef = useRef(ahora)
  escenaRef.current = escena
  paletaRef.current = paleta
  ahoraRef.current = ahora

  useEffect(() => {
    const nodo = contenedor.current
    if (!nodo || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      setRevelado(true)
      return undefined
    }
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          setVisible(e.isIntersecting)
          if (e.isIntersecting) setRevelado(true)
        }),
      { rootMargin: '260px 0px', threshold: 0 }
    )
    io.observe(nodo)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || clima !== null) return undefined
    let vivo = true
    const ctrl = new AbortController()
    const corte = setTimeout(() => ctrl.abort(), 5000)
    fetch('/api/ambiente', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo) setClima(d || { ok: false })
      })
      .catch(() => {
        if (vivo) setClima({ ok: false })
      })
      .finally(() => clearTimeout(corte))
    return () => {
      vivo = false
      ctrl.abort()
    }
  }, [visible, clima])

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 120000)
    return () => clearInterval(id)
  }, [])

  /**
   * Caja de texto para la mascara de legibilidad.
   *
   * Se mide la union de los hijos con contenido, no el contenedor: este
   * ultimo incluye el relleno vertical de la seccion, que puede ser de mas
   * de 150 px y empujaria el velo a cubrir casi todo el lienzo.
   */
  /**
   * Cajas de texto para la mascara de legibilidad.
   *
   * Se mide CADA bloque por separado, no el rectangulo que los envuelve a
   * todos. En una columna estrecha ese rectangulo unico ocupa casi la
   * seccion entera: medido, el velo pasaba de cubrir el 64 por ciento del
   * lienzo en escritorio al 95 por ciento en movil, y la escena quedaba
   * invisible detras de un color plano. Bloque a bloque, los huecos entre
   * parrafos, titulo y tarjetas quedan libres.
   *
   * Tambien se ignora el ancestro con content-visibility: si el navegador
   * aun no libero la contencion de tamano, getBoundingClientRect devuelve
   * el tamano de reemplazo y no el real. Por eso se reintenta al primer
   * cambio de tamano observado.
   */
  const medirCaja = () => {
    const motor = motorRef.current
    const capa = canvasRef.current
    const cont = contenidoRef.current
    if (!motor || !capa || !cont) return

    const rc = capa.getBoundingClientRect()
    if (rc.width < 2 || rc.height < 2) return

    const nodos = cont.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, [data-fa-texto]'
    )
    const lista = nodos.length ? nodos : cont.children

    const cajas = []
    for (const nodo of lista) {
      const r = nodo.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) continue
      cajas.push({
        x0: r.left - rc.left,
        x1: r.right - rc.left,
        y0: r.top - rc.top,
        y1: r.bottom - rc.top,
      })
    }

    if (!cajas.length) {
      const r = cont.getBoundingClientRect()
      cajas.push({
        x0: r.left - rc.left,
        x1: r.right - rc.left,
        y0: r.top - rc.top,
        y1: r.bottom - rc.top,
      })
    }
    motor.fijarCajaTexto(cajas)
  }

  useEffect(() => {
    if (reducido || !visible) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const motor = crearMotor(canvas, { dprMax: 1.5 })
    if (!motor) return undefined
    motorRef.current = motor
    // Se le entrega la escena de inmediato, sin esperar al efecto siguiente.
    motor.actualizarEscena(escenaRef.current, paletaRef.current, ahoraRef.current)

    let raf = 0
    let corriendo = true
    let ultimo = 0
    let calidad = 1
    let objetivo = OBJETIVO_MS
    let apagado = false

    // Muestras de tiempo de cuadro para la degradacion adaptativa.
    //
    // Antes se promediaban 45 cuadros seguidos. Durante un desplazamiento el
    // hilo principal esta saturado y ese promedio se dispara, asi que la
    // degradacion se activaba por el scroll y no por el dispositivo. Dos
    // reducciones seguidas apagaban el lienzo de forma permanente, sin
    // ninguna via de vuelta: eso convertia un tiron pasajero en un fondo
    // muerto para el resto de la visita.
    //
    // Ahora se usa la MEDIANA, que ignora los picos aislados del scroll, no
    // se mide mientras hay desplazamiento en curso, y la degradacion es
    // reversible: si el dispositivo se recupera, la calidad vuelve a subir.
    let muestras = []
    let ultimoScroll = 0
    let estable = 0

    const marcarScroll = () => {
      ultimoScroll = performance.now()
    }
    window.addEventListener('scroll', marcarScroll, { passive: true })

    const dimensionar = () => {
      const r = canvas.getBoundingClientRect()
      motor.dimensionar(r.width, r.height)
      medirCaja()
    }

    const cuadro = (t) => {
      if (!corriendo) return
      raf = requestAnimationFrame(cuadro)
      // El primer cuadro debe valer el objetivo, no 16.7: con 16.7 en una
      // pantalla de 60 Hz la guarda de abajo retorna siempre antes de
      // asignar ultimo, y el bucle no dibuja nunca.
      const dt = ultimo ? t - ultimo : objetivo
      if (dt < objetivo - 1) return
      ultimo = t

      // No se mide durante el desplazamiento ni en los 400 ms siguientes.
      const enScroll = t - ultimoScroll < 400
      if (!enScroll) muestras.push(dt)

      if (muestras.length >= 45) {
        muestras.sort((a, b) => a - b)
        const mediana = muestras[Math.floor(muestras.length / 2)]
        muestras = []

        if (mediana > objetivo * 1.7) {
          estable = 0
          if (calidad > 0.4) {
            calidad *= 0.65
            motor.calidad(0.65)
            objetivo = 1000 / 24
          } else if (calidad > 0.18) {
            // Ultimo escalon antes de rendirse: densidad minima, no apagado.
            calidad *= 0.5
            motor.calidad(0.5)
          }
        } else if (mediana < objetivo * 0.85) {
          // El dispositivo sostiene el ritmo. Si lleva varias ventanas
          // estable y antes se habia degradado, se recupera densidad.
          estable++
          if (estable >= 3 && calidad < 1) {
            calidad = Math.min(1, calidad / 0.65)
            motor.calidad(1 / 0.65)
            if (calidad > 0.9) objetivo = OBJETIVO_MS
            estable = 0
          }
        }
      }

      const nodo = contenedor.current
      if (nodo) {
        const r = nodo.getBoundingClientRect()
        motor.fijarProgreso(
          Math.max(0, Math.min(1, 1 - (r.top + r.height) / (window.innerHeight + r.height)))
        )
      }
      motor.cuadro(t, dt)
    }

    const alternar = () => {
      if (apagado) return
      if (document.hidden) {
        corriendo = false
        cancelAnimationFrame(raf)
      } else if (!corriendo) {
        corriendo = true
        ultimo = 0
        raf = requestAnimationFrame(cuadro)
      }
    }

    dimensionar()
    raf = requestAnimationFrame(cuadro)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(dimensionar) : null
    if (ro) {
      ro.observe(canvas)
      if (contenidoRef.current) ro.observe(contenidoRef.current)
    }
    document.addEventListener('visibilitychange', alternar)

    return () => {
      corriendo = false
      cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      window.removeEventListener('scroll', marcarScroll)
      document.removeEventListener('visibilitychange', alternar)
      motor.destruir()
      motorRef.current = null
    }
  }, [visible, reducido])

  // El motor recibe la escena en cuanto cambia el estado o pasa el tiempo.
  useEffect(() => {
    const motor = motorRef.current
    if (!motor) return
    motor.actualizarEscena(escena, paleta, ahora)
    medirCaja()
  }, [escena, paleta, ahora])

  const capa = nativo ? 'fondo-ambiental-capa fondo-ambiental-scroll' : 'fondo-ambiental-capa'

  return (
    <div
      ref={contenedor}
      data-polaridad={paleta.polaridad}
      className={`fondo-ambiental relative isolate overflow-hidden ${className}`}
      style={{
        '--fa-cenit': paleta.cenit,
        '--fa-horizonte': paleta.horizonte,
        '--fa-texto': paleta.texto,
        '--fa-texto-suave': paleta.textoSuave,
        '--fa-borde': paleta.borde,
        color: paleta.texto,
      }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 ${capa}`}
        style={{
          backgroundImage: `linear-gradient(to bottom, ${paleta.cenit} 0%, ${paleta.cenit} 40%, ${paleta.horizonte} 100%)`,
          opacity: nativo ? undefined : revelado ? 1 : 0,
        }}
      >
        {!reducido && visible && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />}
      </div>
      <div ref={contenidoRef}>{children}</div>
    </div>
  )
}
