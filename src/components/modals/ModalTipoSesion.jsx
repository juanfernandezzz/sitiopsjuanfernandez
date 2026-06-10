import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CAL_USERNAME, CAL_EVENTS, CAL_NAMESPACE, calFullUrl } from '../../lib/cal';
import { PRECIOS } from '../../lib/precios';

/**
 * Modal que pregunta el tipo de usuario/pago ANTES de abrir Cal.com, para que el
 * CTA "Agendar" del header dirija al evento correcto en lugar de asumir Fonasa.
 *
 * Cada opción inyecta los atributos data-cal-* que el script de @calcom/embed-react
 * escucha. Fallback defensivo: si Cal no cargó, abre la URL directa en pestaña nueva.
 *
 * CRO: reduce fricción de elegir el evento equivocado y aclara expectativas de pago
 * en el punto de decisión, sin sacar al usuario del sitio.
 */

const OPCIONES = [
  {
    key: 'primeraSesionFonasa',
    titulo: 'Primera sesión con bono Fonasa',
    detalle: `Si es tu primera vez conmigo. Copago ${PRECIOS.fonasaCopago.display}.`,
    destacada: true,
  },
  {
    key: 'controlAvanceFonasa',
    titulo: 'Sesión de avance con bono Fonasa',
    detalle: `Si ya iniciaste tratamiento conmigo. Copago ${PRECIOS.fonasaCopago.display}.`,
  },
  {
    key: 'parejaFonasa',
    titulo: 'Sesión de pareja con bono Fonasa',
    detalle: `Con ambos miembros presentes. Copago ${PRECIOS.fonasaCopago.display}.`,
  },
  {
    key: 'particular15000',
    titulo: 'Sesión particular',
    detalle: `Sin previsión requerida. ${PRECIOS.particular.display}.`,
  },
];

export default function ModalTipoSesion({ open, onClose }) {
  const panelRef = useRef(null);
  const firstBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => firstBtnRef.current?.focus(), 120);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const handlePick = (key) => {
    // Si Cal no está inicializado, abrimos la URL directa como fallback.
    if (typeof window !== 'undefined' && !window.Cal) {
      window.open(calFullUrl(CAL_EVENTS[key]), '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tipo-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            // Cierra solo si el clic cae directamente en el backdrop, no en un
            // hijo. Evitamos stopPropagation en el panel: ese stopPropagation
            // cortaba el burbujeo del clic hasta document, donde Cal.com tiene su
            // listener delegado de data-cal-link, y por eso el calendario no abría.
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-4"
        >
          <motion.div
            key="tipo-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Elige el tipo de sesión"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-cream rounded-2xl shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
              <div>
                <h2
                  className="font-display text-ink"
                  style={{
                    fontSize: 22,
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    fontVariationSettings: '"opsz" 144, "SOFT" 50',
                  }}
                >
                  ¿Qué tipo de sesión quieres agendar?
                </h2>
                <p className="font-body text-ink/75" style={{ fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>
                  Elige una opción y te muestro el calendario con la hora que te acomode.
                </p>
              </div>
              <button
                aria-label="Cerrar"
                onClick={onClose}
                className="p-2 -mr-2 -mt-1 text-ink/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light rounded"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 px-6 pb-6 pt-1">
              {OPCIONES.map((op, i) => (
                <button
                  key={op.key}
                  ref={i === 0 ? firstBtnRef : null}
                  type="button"
                  data-cal-link={`${CAL_USERNAME}/${CAL_EVENTS[op.key]}`}
                  data-cal-namespace={CAL_NAMESPACE}
                  data-cal-config='{"layout":"month_view","theme":"light"}'
                  onClick={() => handlePick(op.key)}
                  className="group text-left rounded-xl p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  style={{
                    background: '#FFFDF8',
                    border: op.destacada
                      ? '1.5px solid #C97B5E'
                      : '1px solid rgba(63,91,74,0.18)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C97B5E';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = op.destacada
                      ? '#C97B5E'
                      : 'rgba(63,91,74,0.18)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span className="font-body font-semibold text-ink block" style={{ fontSize: 16 }}>
                    {op.titulo}
                  </span>
                  <span className="font-body text-ink/75 block" style={{ fontSize: 14, marginTop: 2 }}>
                    {op.detalle}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
