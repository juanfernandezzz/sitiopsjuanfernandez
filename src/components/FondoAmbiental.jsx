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
  const medirCaja = () => {
    const motor = motorRef.current
    const capa = canvasRef.current
    const cont = contenidoRef.current
    if (!motor || !capa || !cont) return

    const rc = capa.getBoundingClientRect()
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity

    const hijos = cont.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, [data-fa-texto]'
    )
    const nodos = hijos.length ? hijos : cont.children

    for (const nodo of nodos) {
      const r = nodo.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      x0 = Math.min(x0, r.left)
      y0 = Math.min(y0, r.top)
      x1 = Math.max(x1, r.right)
      y1 = Math.max(y1, r.bottom)
    }
    if (!Number.isFinite(x0)) {
      const r = cont.getBoundingClientRect()
      x0 = r.left
      y0 = r.top
      x1 = r.right
      y1 = r.bottom
    }

    motor.fijarCajaTexto({
      x0: x0 - rc.left,
      x1: x1 - rc.left,
      y0: y0 - rc.top,
      y1: y1 - rc.top,
    })
  }

  useEffect(() => {
    if (reducido || !visible) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const motor = crearMotor(canvas, { dprMax: 1.5 })
    if (!motor) return undefined
    motorRef.current = motor

    let raf = 0
    let corriendo = true
    let ultimo = 0
    let suma = 0
    let n = 0
    let calidad = 1
    let objetivo = OBJETIVO_MS
    let apagado = false

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

      suma += dt
      n++
      if (n >= 45) {
        const medio = suma / n
        if (medio > objetivo * 1.7) {
          if (calidad > 0.4) {
            calidad *= 0.65
            motor.calidad(0.65)
            objetivo = 1000 / 24
          } else {
            corriendo = false
            apagado = true
            cancelAnimationFrame(raf)
            return
          }
        }
        suma = 0
        n = 0
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
