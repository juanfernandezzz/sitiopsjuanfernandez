import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CAL_USERNAME, CAL_EVENTS } from '../../lib/cal';
import Button from '../ui/Button';

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
    className="text-sage flex-shrink-0 mt-[3px]"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FEATURES_PARTICULAR = [
  'Videollamada por plataforma certificada por Fonasa',
  'Sesión de 45 minutos',
  'Pagas sesión por sesión, sin compromiso',
  'Comprobante para reembolso de isapre (cuando aplique)',
];

const FEATURES_FONASA = [
  'Sesión de 45 minutos',
  'Disponible para afiliados Fonasa tramos B, C y D',
  'Código 0908101 si eres usuario nuevo',
  'Código 0908102 si ya estás en tratamiento conmigo',
  'Plataforma certificada por Fonasa (Doxy.me)',
];

export default function Precios() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.12 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="precios"
      ref={ref}
      style={{ scrollMarginTop: '80px' }}
      className="bg-cream py-24 md:py-32 px-6"
    >
      <motion.div
        className="max-w-6xl mx-auto"
        variants={container}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="text-center mb-16 md:mb-20 max-w-2xl mx-auto"
        >
          <p className="text-sage text-xs uppercase tracking-[0.2em] font-body mb-4">
            Precios transparentes
          </p>
          <h2
            className="font-display text-4xl md:text-5xl text-ink mb-5"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            Precios y formas de pago
          </h2>
          <p className="font-body text-lg text-ink/70 leading-relaxed">
            Sesión de 45 minutos. Misma duración y dedicación independiente del modo de pago.
          </p>
        </motion.div>

        {/* Grid: dos cards principales */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Card A: Particular */}
          <motion.article
            variants={item}
            className="bg-offwhite rounded-2xl p-8 md:p-10 flex flex-col"
            style={{
              boxShadow:
                '0 1px 3px rgba(42, 59, 76, 0.04), 0 8px 24px rgba(42, 59, 76, 0.04)',
            }}
          >
            <h3 className="font-display text-xl text-ink mb-6">Sesión particular</h3>

            <div className="mb-8">
              <p
                className="font-display text-5xl md:text-6xl text-ink leading-none mb-2"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                $15.000
              </p>
              <p className="font-body text-sm text-sage">
                Por sesión de 45 minutos
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {FEATURES_PARTICULAR.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 font-body text-[15px] text-ink/80 leading-snug"
                >
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              data-cal-link={`${CAL_USERNAME}/${CAL_EVENTS.particular15000}`}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Agendar particular
            </Button>
          </motion.article>

          {/* Card B: Fonasa (destacada) */}
          <motion.article
            variants={item}
            className="relative bg-offwhite rounded-2xl p-8 md:p-10 flex flex-col"
            style={{
              border: '1.5px solid #C97B5E',
              boxShadow:
                '0 1px 3px rgba(201, 123, 94, 0.08), 0 12px 32px rgba(201, 123, 94, 0.08)',
            }}
          >
            {/* Badge superpuesto */}
            <span className="absolute -top-3 right-6 bg-terracotta text-cream font-body text-[11px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full select-none">
              Más utilizada
            </span>

            <h3 className="font-display text-xl text-ink mb-6">
              Sesión con bono Fonasa
            </h3>

            <div className="mb-8">
              <p
                className="font-display text-5xl md:text-6xl text-ink leading-none mb-2"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                $5.570
              </p>
              <p className="font-body text-sm text-sage">
                Copago Modalidad Libre Elección
              </p>
            </div>

            <ul className="space-y-3 mb-5">
              {FEATURES_FONASA.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 font-body text-[15px] text-ink/80 leading-snug"
                >
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="font-body text-[13px] text-ink/55 leading-relaxed mb-7">
              Compras el bono antes de la sesión y me envías el folio por WhatsApp (o una foto donde se vea el número).
            </p>

            <Button
              data-cal-link={`${CAL_USERNAME}/${CAL_EVENTS.primeraSesionFonasa}`}
              variant="primary"
              size="lg"
              className="w-full mb-4"
            >
              Agendar primera sesión Fonasa
            </Button>

            <button
              type="button"
              data-cal-link={`${CAL_USERNAME}/${CAL_EVENTS.controlAvanceFonasa}`}
              className="font-body text-[13px] text-sage/80 hover:text-sage underline decoration-sage/30 hover:decoration-sage underline-offset-4 transition-colors duration-200 text-center w-full"
            >
              ¿Ya estás en tratamiento conmigo? Agenda tu sesión de avance →
            </button>
          </motion.article>
        </div>

        {/* Card C: Pareja (debajo del grid principal, discreta) */}
        <motion.article
          variants={item}
          className="bg-offwhite rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="md:max-w-xl">
            <h3 className="font-display text-lg text-ink mb-2">
              Terapia de pareja con bono Fonasa
            </h3>
            <p className="font-body text-sm text-ink/65 leading-relaxed">
              Código 0908103 · Copago $5.570 · Sesión de 45 minutos con ambos miembros presentes.
            </p>
          </div>
          <Button
            data-cal-link={`${CAL_USERNAME}/${CAL_EVENTS.parejaFonasa}`}
            variant="outline"
            size="md"
            className="md:flex-shrink-0"
          >
            Agendar sesión de pareja
          </Button>
        </motion.article>
      </motion.div>
    </section>
  );
}
