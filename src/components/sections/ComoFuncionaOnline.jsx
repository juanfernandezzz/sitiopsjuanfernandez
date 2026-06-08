import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PRECIOS } from '../../lib/precios';

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

const STEPS = [
  {
    num: '01',
    title: 'Tu reserva queda confirmada',
    text: 'Recibes en tu email la confirmación con fecha, hora y enlace de la sesión. Todo desde Cal.com.',
    nota: 'Antes de la sesión: compras tu bono Fonasa y me envías el folio, o pagas la sesión particular por transferencia o WebPay. Te lo recuerdo en el mismo correo.',
  },
  {
    num: '02',
    title: 'Recibes el link de la sala',
    text: 'Te envío por email el link a mi sala virtual en Doxy.me, plataforma certificada por Fonasa para teleconsulta. No necesitas descargar nada.',
  },
  {
    num: '03',
    title: 'A tu hora, abres el link',
    text: 'Desde cualquier navegador (Chrome, Safari, Firefox). Das permiso a cámara y micrófono. Quedas en sala de espera.',
  },
  {
    num: '04',
    title: 'Yo te admito a la sesión',
    text: 'Cuando estoy listo, te conecto. Hablamos 45 minutos como en cualquier consulta, solo que desde donde estés.',
  },
];

const TRUST_ITEMS = [
  { Icon: WifiIcon, title: 'Conexión estable', text: 'Wi-Fi recomendado' },
  { Icon: HeadphonesIcon, title: 'Privacidad', text: 'Lugar tranquilo y solo tú' },
  { Icon: LockIcon, title: 'Llamada cifrada', text: 'Conexión protegida' },
];

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
            Teleconsulta paso a paso
          </p>
          <h2
            className="font-display text-4xl md:text-5xl text-ink mb-5"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            Cómo funciona una sesión online
          </h2>
          <p className="font-body text-[18px] md:text-[20px] text-ink/80 leading-relaxed">
            Es más simple de lo que parece. En 4 pasos.
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
              <h3 className="font-display text-xl text-ink mb-3">{s.title}</h3>
              <p className="font-body text-[16px] md:text-[17px] text-ink/78 leading-[1.65]">
                {s.text}
              </p>
              {s.nota && (
                <p className="mt-3 font-body text-[14px] text-ink/60 leading-[1.6] border-l-2 border-sage/30 pl-3">
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
                <p className="font-body text-sm text-ink/65">{text}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Nota de pago: primero copago Fonasa, luego particular */}
        <motion.p
          variants={item}
          className="font-body text-[16px] text-ink/75 text-center max-w-[52ch] mx-auto leading-relaxed mb-6"
        >
          El pago es simple: copago de {PRECIOS.fonasaCopago.display} con bono Fonasa, o {PRECIOS.particular.display} en modalidad particular. Lo eliges al momento de agendar.
        </motion.p>

        {/* Closing line */}
        <motion.p
          variants={item}
          className="font-body text-[15px] italic text-ink/65 text-center max-w-[50ch] mx-auto leading-relaxed"
        >
          Si en cualquier momento la conexión falla, te llamo o coordinamos por WhatsApp para retomar.
        </motion.p>
      </motion.div>
    </section>
  );
}
