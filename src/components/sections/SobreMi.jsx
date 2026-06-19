import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import { useUI } from '../../lib/uiContext';
import { SOBRE_MI } from '../../lib/sobreMi';
import { CREDENCIALES } from '../../lib/credenciales';

/**
 * Seccion "Sobre mi" (ancla #bio). Reune en un solo lugar la presentacion
 * canonica de Juan y la prueba de autoridad (credenciales), para bajar la
 * redundancia y la carga cognitiva: antes la formacion vivia en una franja
 * suelta. Aqui la voz del profesional y su registro se leen juntos, que es como
 * la evidencia en credibilidad web recomienda presentarlos (persona real +
 * experiencia declarada).
 *
 * Decision deliberada: NO repetir la foto del Hero. El rostro ya ancla la
 * portada; duplicarlo a media pagina resta y se lee como plantilla. Aqui pesa
 * la palabra (bio como declaracion) y la prueba (tarjeta de credenciales).
 *
 * Restricciones duras heredadas de credenciales.js: ingles C1, nunca C2; nunca
 * el registro Mineduc de Educacion Especial en contexto clinico. El texto de
 * `bio` es canonico: se usa literal, no se reescribe.
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
    className="text-sage flex-shrink-0 mt-[2px]"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function SobreMi() {
  const reduce = useReducedMotion();
  const { openTipoSesionModal } = useUI();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="relative bg-cream text-ink overflow-hidden"
      aria-label="Sobre mí"
    >
      {/* Separador superior fino, coherente con el resto del cuerpo */}
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="h-px bg-ink/10" aria-hidden="true" />
      </div>

      {/* Acento geométrico discreto, en el lado opuesto al de Cómo trabajo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-32 w-[360px] h-[360px] rounded-full bg-sage-light/12 blur-3xl"
      />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="relative mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-5 gap-10 lg:gap-16 items-start"
      >
        {/* Columna voz: eyebrow + titulo + bio canónica como declaración */}
        <div className="lg:col-span-3">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 font-body text-[13px] uppercase tracking-[0.2em] text-sage mb-5"
          >
            <span className="w-6 h-px bg-sage" aria-hidden="true" />
            {SOBRE_MI.eyebrow}
          </motion.span>

          <motion.h2
            variants={item}
            className="font-display text-ink max-w-[18ch]"
            style={{
              fontWeight: 600,
              fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
              fontSize: 'clamp(1.85rem, 4.2vw, 3rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
            }}
          >
            {SOBRE_MI.titulo}
          </motion.h2>

          {/* Bio canónica: regla terracota a la izquierda, tratamiento de
              declaración. Texto literal, sin reescritura. */}
          <motion.div
            variants={item}
            className="mt-8 border-l-2 border-terracota/55 pl-5 lg:pl-6"
          >
            <p className="font-body text-[18px] lg:text-[20px] leading-[1.7] text-ink/85 max-w-[52ch]">
              {SOBRE_MI.bio}
            </p>
          </motion.div>

          {/* Enfoque y formato: mismo texto que la app (fuente única sobreMi.js).
              "Sin compromiso" en la primera sesión baja la fricción de decisión. */}
          <div className="mt-10 grid gap-7 sm:grid-cols-2 max-w-[58ch]">
            {[SOBRE_MI.enfoque, SOBRE_MI.formato].map((bloque) => (
              <motion.div key={bloque.titulo} variants={item}>
                <p className="font-body text-[12px] uppercase tracking-[0.18em] text-sage mb-2">
                  {bloque.titulo}
                </p>
                <p className="font-body text-[16px] leading-[1.6] text-ink/78">
                  {bloque.texto}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Columna prueba: tarjeta de credenciales + CTA secundaria */}
        <motion.div variants={item} className="lg:col-span-2">
          <div className="rounded-2xl bg-offwhite ring-1 ring-sage/20 shadow-[0_24px_50px_-30px_rgba(63,91,74,0.35)] p-7 lg:p-8">
            <p className="font-body text-[12px] uppercase tracking-[0.18em] text-sage mb-5">
              Formación y registro
            </p>
            <ul className="grid gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {CREDENCIALES.map((credencial) => (
                <li
                  key={credencial}
                  className="flex gap-3 font-body text-[15px] text-ink/82 leading-[1.5]"
                >
                  <CheckIcon />
                  <span>{credencial}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 pt-6 border-t border-ink/10">
              <Button
                size="md"
                variant="secondary"
                onClick={openTipoSesionModal}
                className="w-full"
              >
                Agendar tu sesión
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
