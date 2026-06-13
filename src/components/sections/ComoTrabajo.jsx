import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import { useUI } from '../../lib/uiContext';
import { PROCESO_TRABAJO } from '../../lib/proceso';

const PASOS = PROCESO_TRABAJO.pasos;

export default function ComoTrabajo() {
  const reduce = useReducedMotion();
  const { openTipoSesionModal } = useUI();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };
  const stepItem = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="relative bg-cream text-ink overflow-hidden"
      aria-label="Cómo trabajo"
    >
      {/* Separador visual sutil del Hero: línea horizontal fina */}
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="h-px bg-ink/10" aria-hidden="true" />
      </div>

      {/* Acento geométrico discreto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-sage-light/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Eyebrow */}
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 font-body text-[13px] uppercase tracking-[0.2em] text-sage mb-5"
          >
            <span className="w-6 h-px bg-sage" aria-hidden="true" />
            {PROCESO_TRABAJO.eyebrow}
          </motion.span>

          {/* Headline */}
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
            {PROCESO_TRABAJO.titulo}
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            variants={item}
            className="mt-5 font-body text-[18px] lg:text-[20px] leading-[1.6] text-ink/80 max-w-[44ch]"
          >
            {PROCESO_TRABAJO.sub}
          </motion.p>
        </motion.div>

        {/* Pasos numerados */}
        <div className="relative mt-16 lg:mt-24">
          {/* Línea conectora horizontal sutil, solo en desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-[58px] left-[8%] right-[8%] h-px bg-sage-light/30"
          />

          <motion.ol
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="relative grid gap-12 lg:gap-10 lg:grid-cols-3"
          >
            {PASOS.map((paso) => (
              <motion.li
                key={paso.num}
                variants={stepItem}
                className="relative flex flex-col"
              >
                <span
                  aria-hidden="true"
                  className="font-display block leading-none text-terracota/55"
                  style={{
                    fontSize: 'clamp(4.5rem, 7vw, 6rem)',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {paso.num}
                </span>
                <h3
                  className="font-display text-ink mt-3"
                  style={{
                    fontWeight: 600,
                    fontVariationSettings: '"opsz" 36, "SOFT" 50',
                    fontSize: 'clamp(1.35rem, 2.2vw, 1.55rem)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {paso.titulo}
                </h3>
                <p className="mt-3 font-body text-[16px] lg:text-[17px] leading-[1.65] text-ink/78 max-w-[34ch]">
                  {paso.cuerpo}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>

        {/* Trust line + CTA final */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-16 lg:mt-20 pt-10 border-t border-ink/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        >
          <motion.p
            variants={item}
            className="font-body text-[15px] text-sage max-w-[44ch] leading-[1.55]"
          >
            {PROCESO_TRABAJO.cierreTrust}
          </motion.p>
          <motion.div variants={item} className="shrink-0">
            <Button size="lg" variant="primary" onClick={openTipoSesionModal}>
              Agendar tu sesión
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
