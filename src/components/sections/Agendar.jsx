import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { CAL_USERNAME, CAL_EVENTS, CAL_NAMESPACE } from '../../lib/cal';
import { PRECIOS } from '../../lib/precios';
import { useUI } from '../../lib/uiContext';

// Cal embed se carga lazy para no inflar el bundle inicial.
const Cal = lazy(() =>
  import('@calcom/embed-react').then((m) => ({ default: m.default }))
);

const TABS = [
  { key: 'primeraSesionFonasa', label: 'Primera sesión individual con bono Fonasa', price: PRECIOS.fonasaCopago.display },
  { key: 'controlAvanceFonasa', label: 'Sesión individual de avance con bono Fonasa', price: PRECIOS.fonasaCopago.display },
  { key: 'parejaFonasa', label: 'Sesión de pareja con bono Fonasa', price: PRECIOS.fonasaCopago.display },
  { key: 'particular15000', label: 'Sesión particular', price: PRECIOS.particular.display },
];

const REASSURANCES = [
  'Recibes confirmación inmediata por correo',
  'Recordatorios automáticos 24h y 1h antes',
  'Puedes reagendar hasta 6 horas antes, sin costo',
];

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-sage flex-shrink-0"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const EmbedSkeleton = () => (
  <div
    className="w-full h-full animate-pulse rounded-2xl"
    style={{
      background:
        'linear-gradient(90deg, rgba(63,91,74,0.06) 0%, rgba(63,91,74,0.12) 50%, rgba(63,91,74,0.06) 100%)',
      minHeight: 640,
    }}
    aria-label="Cargando calendario"
  />
);

export default function Agendar() {
  const [selectedKey, setSelectedKey] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChooseWarning, setShowChooseWarning] = useState(false);

  const ref = useRef(null);
  const refTabs = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();
  const { pendingAgendarTab, clearPendingAgendarTab } = useUI();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Sincroniza tab activo con pendingAgendarTab (seteado desde el modal Fonasa).
  useEffect(() => {
    if (!pendingAgendarTab) return;
    if (CAL_EVENTS[pendingAgendarTab]) {
      setSelectedKey(pendingAgendarTab);
    }
    if (typeof window !== 'undefined') {
      const section = document.getElementById('agendar');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    clearPendingAgendarTab();
  }, [pendingAgendarTab, clearPendingAgendarTab]);

  const calLink = selectedKey ? `${CAL_USERNAME}/${CAL_EVENTS[selectedKey]}` : null;

  const pedirSeleccion = () => {
    setShowChooseWarning(true);
    if (typeof window !== 'undefined' && refTabs.current) {
      refTabs.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      ref={ref}
      className="relative bg-cream py-16 md:py-20 px-5 md:px-8"
      aria-labelledby="agendar-heading"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="mx-auto"
        style={{ maxWidth: 1080 }}
      >
        {/* Eyebrow */}
        <motion.p
          variants={item}
          className="font-body uppercase text-sage"
          style={{
            fontSize: 13,
            letterSpacing: '0.18em',
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Reserva tu sesión
        </motion.p>

        {/* H2 */}
        <motion.h2
          variants={item}
          id="agendar-heading"
          className="font-display text-ink"
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            marginBottom: 18,
            textWrap: 'balance',
          }}
        >
          Agendar sesión
        </motion.h2>

        {/* Subtítulo */}
        <motion.p
          variants={item}
          className="font-body text-ink/70"
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            maxWidth: 620,
            marginBottom: 32,
          }}
        >
          Elige el tipo de sesión y la hora que te acomode.
        </motion.p>

        {/* Aviso: elige una opción antes de agendar */}
        <AnimatePresence>
          {showChooseWarning && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={
                reduce
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
              }
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0.2 : 0.5, ease: 'easeOut' }}
              className="font-body"
              style={{
                background: 'rgba(201,123,94,0.12)',
                border: '1px solid rgba(201,123,94,0.5)',
                color: '#9C5638',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Elige una opción antes de agendar.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Segmented control */}
        <motion.div
          ref={refTabs}
          variants={item}
          role="tablist"
          aria-label="Tipo de sesión"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 bg-offwhite"
          style={{
            border: '1px solid rgba(63,91,74,0.15)',
            borderRadius: 14,
            padding: 6,
          }}
        >
          {TABS.map((tab) => {
            const active = tab.key === selectedKey;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedKey(tab.key);
                  setShowChooseWarning(false);
                }}
                className="font-body transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                style={{
                  backgroundColor: active ? '#C97B5E' : 'transparent',
                  color: active ? '#F6F1E8' : 'rgba(42,59,76,0.7)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  lineHeight: 1.25,
                  width: '100%',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = '#3F5B4A';
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.color = 'rgba(42,59,76,0.7)';
                }}
              >
                <span style={{ whiteSpace: 'normal' }}>{tab.label}</span>
                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.85,
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  {tab.price}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Embed (desktop) o popup CTA (mobile) */}
        <motion.div
          variants={item}
          className="bg-offwhite"
          style={{
            border: '1px solid rgba(63,91,74,0.15)',
            borderRadius: 16,
            overflow: 'hidden',
            minHeight: isMobile ? 0 : 760,
          }}
        >
          {isMobile ? (
            <div
              style={{
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                textAlign: 'center',
              }}
            >
              <p
                className="font-body text-ink/75"
                style={{
                  fontSize: 16,
                  lineHeight: 1.5,
                  maxWidth: 320,
                }}
              >
                Elige una opción arriba y toca el botón para ver el calendario y tu hora.
              </p>
              <button
                type="button"
                {...(selectedKey
                  ? {
                      'data-cal-link': calLink,
                      'data-cal-namespace': CAL_NAMESPACE,
                      'data-cal-config': '{"layout":"month_view","theme":"light"}',
                    }
                  : {})}
                onClick={() => {
                  if (!selectedKey) pedirSeleccion();
                  else setShowChooseWarning(false);
                }}
                className="font-body transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                style={{
                  backgroundColor: '#C97B5E',
                  color: '#F6F1E8',
                  border: 'none',
                  borderRadius: 999,
                  padding: '16px 32px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: 340,
                  boxShadow: '0 4px 12px rgba(201,123,94,0.25)',
                }}
              >
                Ver disponibilidad
              </button>
            </div>
          ) : selectedKey ? (
            <Suspense fallback={<EmbedSkeleton />}>
              <Cal
                key={selectedKey}
                namespace={CAL_NAMESPACE}
                calLink={calLink}
                style={{
                  width: '100%',
                  height: '760px',
                  overflow: 'scroll',
                }}
                config={{ layout: 'month_view', theme: 'light' }}
              />
            </Suspense>
          ) : (
            <div
              style={{
                minHeight: 760,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <p
                className="font-body text-ink/70"
                style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 420 }}
              >
                Elige una opción arriba para ver el calendario con las horas disponibles.
              </p>
            </div>
          )}
        </motion.div>

        {/* Reassurances */}
        <motion.ul
          variants={item}
          className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-8"
          style={{ listStyle: 'none', padding: 0, margin: '32px 0 0 0' }}
        >
          {REASSURANCES.map((text) => (
            <li
              key={text}
              className="font-body text-ink/65"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 15,
                lineHeight: 1.4,
              }}
            >
              <CheckIcon />
              <span>{text}</span>
            </li>
          ))}
        </motion.ul>

        {/* Nota discreta sobre consentimiento informado */}
        <motion.p
          variants={item}
          className="font-body text-ink/55"
          style={{ fontSize: 14, marginTop: 24, lineHeight: 1.5 }}
        >
          Si es tu primera sesión conmigo, recibirás un email con el link al
          consentimiento informado al confirmar tu reserva.{' '}
          <a
            href="/consentimiento.html"
            className="text-sage underline decoration-sage/30 hover:decoration-sage underline-offset-2 transition-colors"
          >
            O entra aquí directamente
          </a>
          .
        </motion.p>
      </motion.div>
    </section>
  );
}
