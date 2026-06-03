/**
 * Modal: Guía paso a paso para comprar bono Fonasa (MLE telepsicología).
 *
 * Trigger: useUI().openFonasaModal() desde Precios (Card B) y FAQ (ítem 4).
 * Render: condicional + AnimatePresence afuera.
 *
 * Accesibilidad:
 *  - role="dialog", aria-modal, aria-labelledby al H3.
 *  - Focus inicial en botón X. Focus trap custom con Tab/Shift+Tab.
 *  - ESC cierra. Click en overlay cierra. Click dentro NO cierra.
 *  - Body scroll lock al abrir, restaurado al cerrar.
 *  - Devuelve focus al elemento que abrió (gestionado en uiContext).
 *
 * Placeholders de imagen: slots VISIBLEMENTE PENDIENTES.
 * El cliente no tiene capturas reales aún (no es afiliado Fonasa).
 * NO referenciar rutas de imagen todavía.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useUI } from '../../lib/uiContext';
import { PRESTADOR } from '../../lib/contacto';
import Button from '../ui/Button';

// RUT del prestador: dato público, leído de la fuente única (contacto.js).
// Antes salía de import.meta.env.VITE_RUT_PROFESIONAL con default 'pendiente',
// lo que arriesgaba mostrar "pendiente" en producción si la variable no estaba
// configurada en Netlify, rompiendo la compra del bono.
const RUT_PROFESIONAL = PRESTADOR.rut;

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '56973394530';
const WA_MESSAGE = encodeURIComponent(
  'Hola Juan, tengo una duda sobre la compra del bono Fonasa.'
);
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const PASOS = [
  {
    titulo: 'Entra a tu cuenta de Mi Fonasa',
    desc:
      'Desde el sitio fonasa.cl, busca el acceso a Mi Fonasa. Vas a necesitar tu ClaveÚnica.',
  },
  {
    titulo: 'Inicia sesión con ClaveÚnica',
    desc:
      'Si todavía no tienes ClaveÚnica, puedes obtenerla en claveunica.gob.cl con tu cédula de identidad. Es gratis y se hace una vez.',
  },
  {
    titulo: 'Busca la opción de compra de bonos en línea',
    desc:
      'Una vez dentro del portal, navega al área de trámites o servicios y selecciona la opción de compra de bonos web.',
  },
  {
    titulo: 'Selecciona el prestador',
    desc:
      'Elige la búsqueda por RUT del prestador e ingresa el mío (lo tienes en el bloque de datos arriba). Verás mi nombre y podrás seleccionarlo.',
  },
  {
    titulo: 'Selecciona el código de prestación',
    desc:
      'Elige uno de los códigos disponibles según el tipo de sesión: 09 08 101 o 09 08 102 para individual, 09 08 103 para pareja. El copago para tramos B, C y D es de $5.570.',
  },
  {
    titulo: 'Paga el bono en línea',
    desc:
      'Confirma el monto y completa el pago con los medios habilitados por Fonasa (Webpay u otros). Recibirás el bono por email con un folio único.',
  },
  {
    titulo: 'Envíame el folio antes de la sesión',
    desc:
      'Por WhatsApp o por email. Sin el folio no puedo registrar la prestación en Fonasa. El bono tiene 30 días de vigencia desde su emisión.',
  },
];

const ADVERTENCIAS = [
  'Tramo Fonasa A no accede a esta modalidad. La atención para tramo A es gratuita en la red pública.',
  'El bono debe comprarse antes de la sesión, no después.',
  'Asegúrate de elegir un código de la familia 0908 (telerehabilitación). Los códigos presenciales son distintos y no aplican a sesiones online.',
  'El bono caduca a los 30 días desde su emisión.',
];

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PictureIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function StepImageSlot() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 mt-4"
      style={{
        aspectRatio: '16 / 10',
        borderRadius: 8,
        backgroundColor: 'rgba(63, 91, 74, 0.05)',
        border: '1px dashed rgba(63, 91, 74, 0.3)',
      }}
      aria-hidden="true"
    >
      <span style={{ color: 'rgba(63, 91, 74, 0.4)' }}>
        <PictureIcon />
      </span>
      <span
        className="font-body uppercase"
        style={{
          fontSize: 12,
          letterSpacing: '0.14em',
          color: 'rgba(63, 91, 74, 0.6)',
        }}
      >
        captura pendiente
      </span>
    </div>
  );
}

export default function ModalGuiaFonasa() {
  const {
    isFonasaModalOpen,
    closeFonasaModal,
    navigateToAgendarFonasa,
  } = useUI();
  const reduce = useReducedMotion();

  const containerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Body scroll lock + ESC + focus inicial + focus trap.
  useEffect(() => {
    if (!isFonasaModalOpen) return;

    // Scroll lock (guarda y restaura).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus inicial al botón X.
    const focusTimer = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    // Handler ESC + Tab trap.
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFonasaModal();
        return;
      }
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusables = containerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFonasaModalOpen, closeFonasaModal]);

  const overlayDur = reduce ? 0 : 0.2;
  const containerDur = reduce ? 0 : 0.25;

  return (
    <AnimatePresence>
      {isFonasaModalOpen && (
        <motion.div
          key="modal-guia-fonasa-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: overlayDur }}
          onClick={closeFonasaModal}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 50,
            backgroundColor: 'rgba(42, 59, 76, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: 12,
          }}
        >
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-guia-fonasa-titulo"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.95 }}
            transition={{ duration: containerDur, ease: [0.22, 1, 0.36, 1] }}
            className="bg-cream relative w-full"
            style={{
              maxWidth: 720,
              maxHeight: '95vh',
              borderRadius: 16,
              overflowY: 'auto',
              boxShadow:
                '0 20px 50px -12px rgba(42, 59, 76, 0.35), 0 8px 24px -8px rgba(42, 59, 76, 0.2)',
            }}
          >
            {/* Botón cerrar: sticky para que siga visible al hacer scroll interno */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                height: 0,
                pointerEvents: 'none',
              }}
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeFonasaModal}
                aria-label="Cerrar guía"
                className="absolute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                style={{
                  pointerEvents: 'auto',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  color: '#3F5B4A',
                  backgroundColor: 'rgba(246, 241, 232, 0.9)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  transition: 'background-color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(168, 181, 160, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(246, 241, 232, 0.9)';
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <div
              style={{
                padding: 'clamp(28px, 5vw, 48px)',
              }}
            >
              {/* Heading + subtítulo */}
              <header style={{ marginBottom: 28, paddingRight: 32 }}>
                <h3
                  id="modal-guia-fonasa-titulo"
                  className="font-display text-ink"
                  style={{
                    fontSize: 'clamp(24px, 3.5vw, 32px)',
                    lineHeight: 1.15,
                    fontVariationSettings: '"opsz" 144, "SOFT" 50',
                    marginBottom: 8,
                  }}
                >
                  Cómo comprar tu bono Fonasa paso a paso
                </h3>
                <p
                  className="font-body"
                  style={{
                    fontSize: 15,
                    color: 'rgba(42, 59, 76, 0.65)',
                    lineHeight: 1.5,
                  }}
                >
                  Tiempo estimado: 5 minutos. Lo puedes hacer 100% online.
                </p>
              </header>

              {/* Bloque datos del prestador */}
              <section
                aria-label="Datos del prestador"
                style={{
                  backgroundColor: 'rgba(63, 91, 74, 0.08)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 32,
                }}
              >
                <h4
                  className="font-display"
                  style={{
                    fontSize: 16,
                    color: '#2F4538',
                    fontWeight: 500,
                    marginBottom: 10,
                  }}
                >
                  Datos para que compres el bono
                </h4>
                <ul
                  className="font-body"
                  style={{
                    fontSize: 14,
                    color: 'rgba(42, 59, 76, 0.8)',
                    lineHeight: 1.7,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  <li>
                    <strong style={{ fontWeight: 600 }}>RUT prestador:</strong>{' '}
                    {RUT_PROFESIONAL}
                  </li>
                  <li>
                    <strong style={{ fontWeight: 600 }}>Nombre:</strong> Juan
                    Fernández
                  </li>
                  <li style={{ marginTop: 4 }}>
                    <strong style={{ fontWeight: 600 }}>
                      Códigos disponibles:
                    </strong>
                    <ul
                      style={{
                        listStyle: 'disc',
                        paddingLeft: 22,
                        marginTop: 4,
                      }}
                      className="marker:text-sage/50"
                    >
                      <li>09 08 101 Telerehabilitación: Psicólogo clínico (sesiones 45')</li>
                      <li>09 08 102 Telerehabilitación: Psicoterapia individual</li>
                      <li>09 08 103 Telerehabilitación: Sesión de psicoterapia de pareja (con ambos miembros)</li>
                    </ul>
                  </li>
                </ul>
              </section>

              {/* Lista de pasos */}
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {PASOS.map((paso, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 20,
                      marginBottom: i === PASOS.length - 1 ? 0 : 32,
                    }}
                  >
                    <span
                      className="font-display"
                      aria-hidden="true"
                      style={{
                        fontSize: 48,
                        fontWeight: 300,
                        lineHeight: 1,
                        color: '#A8B5A0',
                        opacity: 0.6,
                        flexShrink: 0,
                        minWidth: 48,
                        fontVariationSettings: '"opsz" 144',
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        className="font-display text-ink"
                        style={{
                          fontSize: 18,
                          fontWeight: 500,
                          marginBottom: 6,
                          lineHeight: 1.3,
                        }}
                      >
                        <span className="sr-only">{`Paso ${i + 1}: `}</span>
                        {paso.titulo}
                      </h4>
                      <p
                        className="font-body"
                        style={{
                          fontSize: 15,
                          color: 'rgba(42, 59, 76, 0.75)',
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {paso.desc}
                      </p>
                      <StepImageSlot />
                    </div>
                  </li>
                ))}
              </ol>

              {/* Bloque advertencias */}
              <section
                aria-label="Errores comunes"
                style={{
                  marginTop: 32,
                  backgroundColor: 'rgba(201, 123, 94, 0.08)',
                  borderLeft: '3px solid #C97B5E',
                  padding: 20,
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              >
                <h4
                  className="font-display"
                  style={{
                    fontSize: 16,
                    color: '#B0664A',
                    fontWeight: 500,
                    marginBottom: 12,
                  }}
                >
                  Errores comunes a evitar
                </h4>
                <ul
                  className="font-body marker:text-[#C97B5E]/60"
                  style={{
                    fontSize: 14,
                    color: 'rgba(42, 59, 76, 0.8)',
                    lineHeight: 1.7,
                    listStyleType: 'disc',
                    paddingLeft: 20,
                    margin: 0,
                  }}
                >
                  {ADVERTENCIAS.map((texto, i) => (
                    <li key={i} style={{ marginBottom: i === ADVERTENCIAS.length - 1 ? 0 : 6 }}>
                      {texto}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Footer CTA */}
              <footer
                style={{
                  marginTop: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={navigateToAgendarFonasa}
                >
                  Agendar mi sesión ahora
                </Button>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-sm"
                  style={{
                    fontSize: 14,
                    color: '#3F5B4A',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(63, 91, 74, 0.3)',
                    textUnderlineOffset: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecorationColor = '#3F5B4A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecorationColor =
                      'rgba(63, 91, 74, 0.3)';
                  }}
                >
                  ¿Tienes una duda? Escríbeme por WhatsApp
                </a>
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
