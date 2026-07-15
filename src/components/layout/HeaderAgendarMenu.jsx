import React, { useEffect, useId, useRef, useState } from 'react';
import { CAL_USERNAME, CAL_EVENTS, CAL_NAMESPACE, calFullUrl } from '../../lib/cal';
import { SESIONES } from '../../lib/sesiones';

/**
 * Menú "Agendar" del header (C26): reemplaza al modal centrado por un
 * desplegable anclado al botón, tanto en desktop como en mobile. Cada fila
 * inyecta los atributos data-cal-* que escucha @calcom/embed-react; si el
 * script de Cal no cargó, abre la URL directa en pestaña nueva (mismo fallback
 * defensivo que usaba el modal).
 *
 * CRO: una sola interacción para ver las cuatro sesiones sin sacar al usuario
 * del contexto del header; el copago vive en cada fila, en el punto de decisión.
 *
 * Las filas se comparten con el panel del menú móvil (componente OpcionesAgendar),
 * para que ambas superficies lean exactamente los mismos strings y enlaces.
 */

// Filas de sesión reutilizables (desplegable de desktop y panel mobile).
export function OpcionesAgendar({ onPick, autoFocusFirst = false }) {
  const firstRef = useRef(null);

  useEffect(() => {
    if (autoFocusFirst) {
      const t = setTimeout(() => firstRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [autoFocusFirst]);

  const handle = (key) => {
    // Fallback: si Cal no se inicializó, abrimos la URL directa y cerramos.
    if (typeof window !== 'undefined' && !window.Cal) {
      window.open(calFullUrl(CAL_EVENTS[key]), '_blank', 'noopener,noreferrer');
      if (onPick) onPick(key);
      return;
    }
    // Cal escucha data-cal-link con un listener DELEGADO en document: el clic
    // abre el calendario recién cuando burbujea hasta ahí. Si cerramos el menú
    // en este mismo tick, React desmonta el botón antes de que el clic llegue a
    // document y Cal nunca ve el data-cal-link (por eso "no hacía nada"). Cerrar
    // en el próximo tick deja el botón montado mientras se procesa el clic; es
    // el mismo motivo por el que el modal (con animación de salida) sí abría.
    if (onPick) setTimeout(() => onPick(key), 0);
  };

  return (
    <div className="flex flex-col gap-2" role="menu" aria-label="Tipos de sesión">
      {SESIONES.map((op, i) => (
        <button
          key={op.key}
          ref={i === 0 ? firstRef : null}
          type="button"
          role="menuitem"
          data-cal-link={`${CAL_USERNAME}/${CAL_EVENTS[op.key]}`}
          data-cal-namespace={CAL_NAMESPACE}
          data-cal-config='{"layout":"month_view","theme":"light"}'
          onClick={() => handle(op.key)}
          className="group text-left rounded-xl p-3.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          style={{
            background: '#FFFDF8',
            border: op.destacada ? '1.5px solid #C97B5E' : '1px solid rgba(63,91,74,0.18)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#C97B5E';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = op.destacada
              ? '#C97B5E'
              : 'rgba(63,91,74,0.18)';
          }}
        >
          <span className="font-body font-semibold text-ink block" style={{ fontSize: 15 }}>
            {op.titulo}
          </span>
          <span className="font-body text-ink/70 block" style={{ fontSize: 13.5, marginTop: 2 }}>
            {op.detalleModal}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function HeaderAgendarMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const menuId = useId();

  // Cierra al hacer clic fuera del conjunto (botón + panel) y con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full font-body font-semibold text-sm text-cream bg-terracotta-deep border-b-2 border-[#7C4129] shadow-[0_6px_20px_-8px_rgba(164,88,59,0.55)] px-5 py-3 transition-all duration-200 ease-out hover:bg-[#8E4B33] hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 select-none"
      >
        Agendar
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute right-0 top-full mt-2 z-50 bg-cream rounded-2xl shadow-2xl ring-1 ring-sage/15 p-2.5"
          style={{ width: 'min(20rem, calc(100vw - 2.5rem))' }}
        >
          <p
            className="font-body text-ink/70 px-1.5 pt-1 pb-2.5"
            style={{ fontSize: 13, lineHeight: 1.4 }}
          >
            Elige el tipo de sesión y te muestro el calendario.
          </p>
          <OpcionesAgendar onPick={() => setOpen(false)} autoFocusFirst />
        </div>
      )}
    </div>
  );
}
