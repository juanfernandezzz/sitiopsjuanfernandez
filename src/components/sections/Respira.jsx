import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import RespiraVisor from '../respira/RespiraVisor';
import Button from '../ui/Button';
import { useUI } from '../../lib/uiContext';
import { RESPIRA_TEXTO } from '../../lib/respiraNucleo';

/**
 * Sección "Respira conmigo" en el inicio (C24 fixpack).
 *
 * Posición: entre Agendar y Preguntas frecuentes. Lógica CRO: quien llega
 * hasta aquí pasó por el punto de conversión sin agendar; una experiencia
 * breve y calmante demuestra el oficio (el sitio te baja el ritmo en vez de
 * empujarte) justo antes del bloque que maneja objeciones. La sección es
 * compacta: el contenido completo (encuadre extendido y CTA) vive en /respira.
 *
 * Vive en el grafo lazy (igual que sus hermanas), así que usar Framer aquí
 * no agrega costo al bundle crítico: el chunk comparte la librería con las
 * secciones vecinas.
 */
export default function Respira() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();
  const { openTipoSesionModal } = useUI();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      aria-labelledby="respira-heading"
      className="bg-cream py-16 md:py-20 px-5 md:px-8"
    >
      <div ref={ref} className="mx-auto w-full" style={{ maxWidth: 880 }}>
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
        >
          {/* Cabecera */}
          <motion.div variants={item} className="mb-10">
            <p
              className="font-body uppercase tracking-widest text-sage mb-3"
              style={{ fontSize: 13 }}
            >
              {RESPIRA_TEXTO.eyebrow}
            </p>
            <h2
              id="respira-heading"
              className="font-display text-ink text-balance mb-4"
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
              }}
            >
              {RESPIRA_TEXTO.titulo}
            </h2>
            <p
              className="font-body text-ink/75"
              style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 620 }}
            >
              {RESPIRA_TEXTO.intro}
            </p>
          </motion.div>

          {/* Visor compartido con /respira */}
          <motion.div variants={item}>
            <RespiraVisor />
          </motion.div>

          {/* Encuadre y seguridad */}
          <motion.div variants={item} className="mt-8 text-center">
            <p
              className="font-body text-ink/75 mx-auto"
              style={{ fontSize: 15, lineHeight: 1.65, maxWidth: '58ch' }}
            >
              {RESPIRA_TEXTO.seguridad}
            </p>
          </motion.div>

          {/* Vía suave hacia agendar (mismo cuadro que /respira) */}
          <motion.div
            variants={item}
            className="mt-10 mx-auto bg-offwhite rounded-2xl px-6 py-8 md:px-10 md:py-10 ring-1 ring-sage/15"
            style={{ maxWidth: 620 }}
          >
            <p
              className="font-body text-ink/80 mb-5"
              style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '50ch' }}
            >
              {RESPIRA_TEXTO.puenteTexto}
            </p>
            <Button size="lg" variant="primary" onClick={openTipoSesionModal}>
              {RESPIRA_TEXTO.puenteCta}
            </Button>
          </motion.div>

          {/* Enlace a la herramienta en su propia página */}
          <motion.div variants={item} className="mt-6 text-center">
            <a
              href="/respira"
              className="font-body text-[15px] text-sage hover:text-[#2F4538] underline decoration-sage/30 hover:decoration-sage underline-offset-4 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-sm"
            >
              Abrir herramienta en su propia página →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
