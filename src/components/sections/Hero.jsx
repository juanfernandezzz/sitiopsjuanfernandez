import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import { CAL_USERNAME, HERO_PRIMARY_CTA, FALLBACK_PARTICULAR_CTA } from '../../lib/cal';

// Imports de la foto (vite-imagetools genera AVIF/WebP en build).
import juanAvif from '../../assets/images/juan.jpg?format=avif&w=720&quality=72';
import juanWebp from '../../assets/images/juan.jpg?format=webp&w=720&quality=78';
import juanJpg from '../../assets/images/juan.jpg?format=jpg&w=720&quality=82';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '56973394530';
const WA_MESSAGE = encodeURIComponent(
  'Hola Juan, vi tu sitio y me gustaría conversar sobre una primera sesión.'
);
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const PRIMARY_CAL_LINK = `${CAL_USERNAME}/${HERO_PRIMARY_CTA}`;
const PARTICULAR_CAL_LINK = `${CAL_USERNAME}/${FALLBACK_PARTICULAR_CTA}`;

export default function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };
  const photoVariant = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.7, delay: reduce ? 0 : 0.2, ease: 'easeOut' } },
  };

  return (
    <section
      id="top"
      className="relative bg-cream text-ink overflow-hidden"
      aria-label="Presentación"
    >
      {/* Textura de grano sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.16  0 0 0 0 0.23  0 0 0 0 0.30  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Acentos geométricos discretos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-sage-light/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-[-80px] w-[360px] h-[360px] rounded-full bg-terracota/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8 pt-10 lg:pt-20 pb-14 lg:pb-24">
        {/* Brand inline */}
        <div className="mb-10 lg:mb-16">
          <span
            className="block font-display text-[22px] lg:text-[26px] text-ink"
            style={{ fontVariationSettings: '"opsz" 48, "SOFT" 50' }}
          >
            Juan Fernández
          </span>
          <span className="block font-body text-[11px] uppercase tracking-[0.22em] text-sage mt-1">
            Psicólogo Clínico
          </span>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col-reverse gap-10 lg:gap-12 lg:grid lg:grid-cols-5 lg:items-center"
        >
          {/* Columna texto */}
          <div className="lg:col-span-3">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 font-body text-[12px] uppercase tracking-[0.22em] text-sage mb-6"
            >
              <span className="w-6 h-px bg-sage" aria-hidden="true" />
              Terapia online en Chile
            </motion.span>

            <motion.h1
              variants={item}
              className="font-display text-ink"
              style={{
                fontWeight: 600,
                fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
                fontSize: 'clamp(2.1rem, 5.2vw, 3.6rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.015em',
                textWrap: 'balance',
              }}
            >
              Terapia psicológica online, hecha para escucharte de verdad.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 font-body text-[17px] lg:text-[18px] leading-[1.6] text-ink/75 max-w-[36ch]"
            >
              Acompañamiento individual con enfoque integrativo, que combina psicología cognitivo-conductual y narrativa. Sesiones de 45 minutos por videollamada segura, con o sin bono Fonasa.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Button size="lg" variant="primary" calLink={PRIMARY_CAL_LINK}>
                Agenda tu primera sesión
              </Button>
              <Button
                size="lg"
                variant="secondary"
                as="a"
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
              >
                Conversemos por WhatsApp
              </Button>
            </motion.div>

            {/* Microcopy: aclara restricción y ofrece ruta alternativa sin abandonar el fold. */}
            <motion.p
              variants={item}
              className="mt-3 font-body text-[13px] text-ink/55"
            >
              Primera sesión con bono Fonasa: copago $5.570.{' '}
              <button
                type="button"
                data-cal-link={PARTICULAR_CAL_LINK}
                data-cal-namespace="psicojuan"
                data-cal-config='{"layout":"month_view"}'
                className="underline decoration-sage/40 underline-offset-2 hover:text-ink hover:decoration-sage transition-colors"
              >
                ¿Sin Fonasa? Ver sesión particular ($15.000) →
              </button>
            </motion.p>

            <motion.ul
              variants={item}
              className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-body text-[13px] lg:text-[14px] text-sage"
            >
              <li>Psicólogo clínico titulado</li>
              <li aria-hidden="true" className="text-sage/50">·</li>
              <li>Inscrito en Fonasa MLE</li>
              <li aria-hidden="true" className="text-sage/50">·</li>
              <li>Plataforma certificada por Fonasa</li>
            </motion.ul>
          </div>

          {/* Columna foto */}
          <motion.div variants={photoVariant} className="lg:col-span-2">
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-sage-light/15 shadow-[0_30px_60px_-30px_rgba(63,91,74,0.35),0_18px_40px_-25px_rgba(201,123,94,0.25)]"
              style={{ aspectRatio: '4 / 5' }}
            >
              {juanJpg ? (
                <picture>
                  <source srcSet={juanAvif} type="image/avif" />
                  <source srcSet={juanWebp} type="image/webp" />
                  <img
                    src={juanJpg}
                    alt="Juan Fernández, psicólogo clínico"
                    width={720}
                    height={900}
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </picture>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-body text-[13px] tracking-wide text-sage/70 text-center px-6">
                    Foto Juan Fernández, pendiente
                  </span>
                </div>
              )}

              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Sentinel para que el Header sepa cuándo activarse */}
      <div id="hero-end-sentinel" aria-hidden="true" className="absolute bottom-0 h-px w-px" />
    </section>
  );
}
