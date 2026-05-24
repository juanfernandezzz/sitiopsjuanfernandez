import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CAL_USERNAME, CAL_EVENTS } from '../../lib/cal';
import { useUI } from '../../lib/uiContext';
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

const FEATURES_FONASA_PRIMERA = [
  'Sesión de 45 minutos',
  'Disponible para afiliados Fonasa tramos B, C y D',
  'Código 0908101 para usuarios nuevos',
  'Plataforma certificada por Fonasa (Doxy.me)',
];

const SECONDARY_CARD_SHADOW = {
  boxShadow:
    '0 1px 3px rgba(42, 59, 76, 0.04), 0 8px 24px rgba(42, 59, 76, 0.04)',
};

export default function Precios() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const { openFonasaModal } = useUI();

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
        className="max-w-3xl mx-auto"
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

        {/* Card 1: Primera sesión Fonasa (destacada) */}
        <motion.article
          variants={item}
          className="relative bg-offwhite rounded-2xl p-8 md:p-10 mb-6 md:mb-8 flex flex-col"
          style={{
            border: '1.5px solid #C97B5E',
            boxShadow:
              '0 1px 3px rgba(201, 123, 94, 0.08), 0 12px 32px rgba(201, 123, 94, 0.08)',
          }}
        >
          <span className="absolute -top-3 right-6 bg-terracotta text-cream font-body text-[11px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full select-none">
            Más utilizada
          </span>

          <h3 className="font-display text-xl text-ink mb-6">
            Primera sesión con bono Fonasa
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
            {FEATURES_FONASA_PRIMERA.map((feature) => (
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

          <button
            type="button"
            onClick={() => openFonasaModal()}
            className="font-body text-[13px] text-sage hover:text-[#2F4538] underline decoration-sage/30 hover:decoration-sage underline-offset-4 mb-5 self-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-sm"
          >
            Ver guía paso a paso para comprar el bono →
          </button>

          <Button
            calLink={`${CAL_USERNAME}/${CAL_EVENTS.primeraSesionFonasa}`}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Agendar primera sesión Fonasa
          </Button>
        </motion.article>

        {/* Card 2: Sesión de avance (Fonasa) */}
        <motion.article
          variants={item}
          className="bg-offwhite rounded-2xl p-6 md:p-8 mb-4 md:mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          style={SECONDARY_CARD_SHADOW}
        >
          <div className="md:max-w-xl">
            <h3 className="font-display text-lg text-ink mb-2">
              Sesión de avance con bono Fonasa
            </h3>
            <p className="mb-2">
              <span
                className="font-display text-2xl md:text-3xl text-ink"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                $5.570
              </span>
              <span className="font-body text-sm text-sage ml-3">
                Copago Modalidad Libre Elección
              </span>
            </p>
            <p className="font-body text-sm text-ink/65 leading-relaxed">
              Para pacientes que ya iniciaron tratamiento conmigo. Código 0908102, sesión de 45 minutos.
            </p>
          </div>
          <Button
            calLink={`${CAL_USERNAME}/${CAL_EVENTS.controlAvanceFonasa}`}
            variant="primary"
            size="md"
            className="md:flex-shrink-0"
          >
            Agendar sesión de avance
          </Button>
        </motion.article>

        {/* Card 3: Terapia de pareja (Fonasa) */}
        <motion.article
          variants={item}
          className="bg-offwhite rounded-2xl p-6 md:p-8 mb-4 md:mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          style={SECONDARY_CARD_SHADOW}
        >
          <div className="md:max-w-xl">
            <h3 className="font-display text-lg text-ink mb-2">
              Terapia de pareja con bono Fonasa
            </h3>
            <p className="mb-2">
              <span
                className="font-display text-2xl md:text-3xl text-ink"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                $5.570
              </span>
              <span className="font-body text-sm text-sage ml-3">
                Copago Modalidad Libre Elección
              </span>
            </p>
            <p className="font-body text-sm text-ink/65 leading-relaxed">
              Código 0908103. Sesión de 45 minutos con ambos miembros presentes.
            </p>
          </div>
          <Button
            calLink={`${CAL_USERNAME}/${CAL_EVENTS.parejaFonasa}`}
            variant="primary"
            size="md"
            className="md:flex-shrink-0"
          >
            Agendar sesión de pareja
          </Button>
        </motion.article>

        {/* Card 4: Sesión particular */}
        <motion.article
          variants={item}
          className="bg-offwhite rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          style={SECONDARY_CARD_SHADOW}
        >
          <div className="md:max-w-xl">
            <h3 className="font-display text-lg text-ink mb-2">
              Sesión particular
            </h3>
            <p className="mb-2">
              <span
                className="font-display text-2xl md:text-3xl text-ink"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                $15.000
              </span>
              <span className="font-body text-sm text-sage ml-3">
                Por sesión de 45 minutos
              </span>
            </p>
            <p className="font-body text-sm text-ink/65 leading-relaxed">
              Sin previsión requerida. Pagas sesión por sesión, sin compromiso. Plataforma certificada por Fonasa. Comprobante para reembolso de isapre cuando aplique.
            </p>
          </div>
          <Button
            calLink={`${CAL_USERNAME}/${CAL_EVENTS.particular15000}`}
            variant="primary"
            size="md"
            className="md:flex-shrink-0"
          >
            Agendar particular
          </Button>
        </motion.article>
      </motion.div>
    </section>
  );
}
