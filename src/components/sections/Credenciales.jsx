import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PRESTADOR } from '../../lib/contacto';

/**
 * Franja compacta de autoridad. Sin testimonios (ética Colpsi 1999), la prueba
 * social es la autoridad del profesional. La evidencia en información de salud
 * en la web es consistente: la autoridad del autor eleva la confianza y la
 * credibilidad percibidas. Por eso vive en el cuerpo (junto a la metodología),
 * no escondida en el footer.
 *
 * Restricciones duras: inglés C1 (nunca C2 hasta nuevo certificado). NO se
 * incluye el registro Mineduc de Educación Especial (fuera del contexto clínico).
 */

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

const CREDENCIALES = [
  `Psicólogo clínico titulado, ${PRESTADOR.universidad}`,
  `Inscrito en la Superintendencia de Salud (N° ${PRESTADOR.rnpi})`,
  'Formación continua: cuidado clínico (Harvard), terapia cognitivo-conductual y Primeros Auxilios Psicológicos (UAB)',
  'Inglés nivel C1 (EF-SET): atención también en inglés',
];

export default function Credenciales() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 },
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
      className="bg-cream px-6 py-14 md:py-16"
      aria-label="Formación y registro"
    >
      <motion.div
        ref={ref}
        variants={container}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="max-w-4xl mx-auto"
      >
        <motion.p
          variants={item}
          className="font-body text-[13px] uppercase tracking-[0.18em] text-sage mb-4 text-center"
        >
          Formación y registro
        </motion.p>

        <motion.h2
          variants={item}
          className="font-display text-2xl md:text-3xl text-ink mb-10 text-center text-balance max-w-[26ch] mx-auto"
          style={{ fontVariationSettings: '"opsz" 72, "SOFT" 50', lineHeight: 1.2 }}
        >
          Atención a cargo de un psicólogo clínico titulado y registrado
        </motion.h2>

        <motion.ul
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {CREDENCIALES.map((credencial) => (
            <li
              key={credencial}
              className="flex gap-3 font-body text-[15px] text-ink/80 leading-snug"
            >
              <CheckIcon />
              <span>{credencial}</span>
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
