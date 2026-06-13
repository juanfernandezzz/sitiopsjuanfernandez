import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PROCESO_ONLINE } from '../../lib/proceso';

const WifiIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-sage"
    aria-hidden="true"
  >
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const HeadphonesIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-sage"
    aria-hidden="true"
  >
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-sage"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const STEPS = PROCESO_ONLINE.pasos;

const ICONOS_CONFIANZA = {
  conexion: WifiIcon,
  privacidad: HeadphonesIcon,
  cifrado: LockIcon,
};

const TRUST_ITEMS = PROCESO_ONLINE.confianza.map((c) => ({
  Icon: ICONOS_CONFIANZA[c.clave],
  title: c.titulo,
  text: c.texto,
}));

export default function ComoFuncionaOnline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      ref={ref}
      className="bg-cream py-16 md:py-20 px-6"
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
          className="text-center mb-12 md:mb-14 max-w-2xl mx-auto"
        >
          <p className="text-sage text-[13px] uppercase tracking-[0.18em] font-body mb-4">
            {PROCESO_ONLINE.eyebrow}
          </p>
          <h2
            className="font-display text-4xl md:text-5xl text-ink mb-5"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            {PROCESO_ONLINE.titulo}
          </h2>
          <p className="font-body text-[18px] md:text-[20px] text-ink/80 leading-relaxed">
            {PROCESO_ONLINE.sub}
          </p>
        </motion.div>

        {/* Steps grid: 1 / 2 / 4 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-14 md:mb-16">
          {STEPS.map((s) => (
            <motion.div key={s.num} variants={item} className="flex flex-col">
              <span
                className="font-display text-6xl md:text-7xl leading-none mb-5"
                style={{
                  fontVariationSettings: '"opsz" 144',
                  color: 'rgba(95, 122, 104, 0.78)',
                }}
              >
                {s.num}
              </span>
              <h3 className="font-display text-xl text-ink mb-3">{s.titulo}</h3>
              <p className="font-body text-[16px] md:text-[17px] text-ink/78 leading-[1.65]">
                {s.texto}
              </p>
              {s.nota && (
                <p className="mt-3 font-body text-[14px] text-ink/75 leading-[1.6] border-l-2 border-sage/30 pl-3">
                  {s.nota}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
        <motion.div
          variants={item}
          className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-16 mb-10 pt-10 border-t border-sage/15"
        >
          {TRUST_ITEMS.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-3"
            >
              <div className="flex-shrink-0 mt-0.5 md:mt-0">
                <Icon />
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-[0.18em] text-sage mb-1.5">
                  {title}
                </p>
                <p className="font-body text-sm text-ink/75">{text}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Nota de pago: primero copago Fonasa, luego particular */}
        <motion.p
          variants={item}
          className="font-body text-[16px] text-ink/75 text-center max-w-[52ch] mx-auto leading-relaxed mb-6"
        >
          {PROCESO_ONLINE.notaPago}
        </motion.p>

        {/* Closing line */}
        <motion.p
          variants={item}
          className="font-body text-[15px] italic text-ink/75 text-center max-w-[50ch] mx-auto leading-relaxed"
        >
          {PROCESO_ONLINE.cierre}
        </motion.p>
      </motion.div>
    </section>
  );
}
