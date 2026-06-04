import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * Franja delgada justo bajo el hero. Reconocimiento en 5 segundos: el visitante
 * se identifica con un motivo en su propio lenguaje antes de procesar la
 * metodología. La metodología (CBT y narrativa) queda como respaldo, no gancho.
 *
 * Decisión CRO (C15): franja separada de las credenciales. Hacen trabajos
 * cognitivos distintos (reconocimiento emocional vs autoridad) y fusionarlas
 * sobrecargaría un solo bloque. No compite con el CTA del fold: vive debajo.
 */

const MOTIVOS = ['Ansiedad', 'Depresión', 'Relaciones', 'Duelo', 'Estrés'];

export default function MotivosConsulta() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.04 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="bg-cream px-6 pt-2 pb-12 md:pb-16" aria-label="Motivos de consulta">
      <motion.div
        ref={ref}
        variants={container}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.p
          variants={item}
          className="font-body text-[13px] uppercase tracking-[0.18em] text-sage mb-5"
        >
          Te acompaño en procesos como estos
        </motion.p>

        <motion.ul
          variants={item}
          className="flex flex-wrap justify-center gap-x-2.5 gap-y-2.5 mb-6"
          style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}
        >
          {MOTIVOS.map((motivo) => (
            <li
              key={motivo}
              className="font-body text-[16px] text-ink/85 bg-offwhite rounded-full px-4 py-1.5"
              style={{ border: '1px solid rgba(63, 91, 74, 0.2)' }}
            >
              {motivo}
            </li>
          ))}
        </motion.ul>

        <motion.p
          variants={item}
          className="font-body text-[16px] md:text-[17px] text-ink/70 leading-relaxed max-w-[46ch] mx-auto"
        >
          Trabajamos juntos a tu ritmo, con un enfoque que combina psicología cognitivo-conductual y narrativa.
        </motion.p>
      </motion.div>
    </section>
  );
}
