import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import { useUI } from '../../lib/uiContext';
import { PROCESO_TRABAJO, PROCESO_ONLINE } from '../../lib/proceso';

/**
 * Seccion unificada "Cómo trabajo" (ancla #como-trabajo). Funde lo que antes
 * eran dos secciones (el arco terapeutico y "Teleconsulta paso a paso") en una
 * sola, para reducir redundancia y carga cognitiva. La fusion es deliberada en
 * la jerarquia, no un apilado:
 *
 *  - PRIMARIO: el arco terapeutico (lo que importa al paciente), en tarjetas
 *    grandes con numeral terracota. Es la secuencia real del proceso, por eso
 *    lleva numeracion.
 *  - SECUNDARIO: la logistica de conexion, en una tira compacta y mas tenue.
 *    Arranca DESPUES de reservar (el paso de reserva ya vive en el arco, paso
 *    01), asi no se repite. Numerales pequenos re-indexados 1..3 para no chocar
 *    con el ladder grande del arco.
 *
 * Deduplicacion: la certificacion Fonasa y el "sin descargas" aparecen una sola
 * vez (en el paso de conexion). El cifrado, una vez (trio de confianza). Por eso
 * NO se renderiza PROCESO_TRABAJO.cierreTrust: repetiria Doxy/Fonasa/descargas.
 *
 * Los iconos del trio de confianza viven aqui (SVG propios del sitio); el texto
 * es fuente unica en proceso.js.
 */

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

const ARCO = PROCESO_TRABAJO.pasos;
// Logistica de conexion: desde que llega el link en adelante. Se omite el paso
// de reserva (PROCESO_ONLINE.pasos[0]) porque ya esta en el arco.
const CONEXION = PROCESO_ONLINE.pasos.slice(1);

const ICONOS_CONFIANZA = { conexion: WifiIcon, privacidad: HeadphonesIcon, cifrado: LockIcon };
const CONFIANZA = PROCESO_ONLINE.confianza.map((c) => ({
  Icon: ICONOS_CONFIANZA[c.clave],
  title: c.titulo,
  text: c.texto,
}));

export default function ComoTrabajo() {
  const reduce = useReducedMotion();
  const { openTipoSesionModal } = useUI();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 } },
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
    <section className="relative bg-cream text-ink overflow-hidden" aria-label="Cómo trabajo">
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
        {/* Encabezado */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 font-body text-[13px] uppercase tracking-[0.2em] text-sage mb-5"
          >
            <span className="w-6 h-px bg-sage" aria-hidden="true" />
            {PROCESO_TRABAJO.eyebrow}
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
            {PROCESO_TRABAJO.titulo}
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-5 font-body text-[18px] lg:text-[20px] leading-[1.6] text-ink/80 max-w-[44ch]"
          >
            {PROCESO_TRABAJO.sub}
          </motion.p>
        </motion.div>

        {/* PRIMARIO: arco terapéutico, tarjetas con numeral grande terracota */}
        <div className="relative mt-16 lg:mt-24">
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
            {ARCO.map((paso) => (
              <motion.li key={paso.num} variants={stepItem} className="relative flex flex-col">
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

        {/* SECUNDARIO: cómo es conectarse. Tira compacta, más tenue que el arco. */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-16 lg:mt-20 pt-10 border-t border-ink/10"
        >
          <motion.h3
            variants={item}
            className="font-display text-ink"
            style={{
              fontWeight: 600,
              fontVariationSettings: '"opsz" 48, "SOFT" 50',
              fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Y conectarte es simple
          </motion.h3>

          <motion.ol
            variants={container}
            className="mt-8 grid gap-8 sm:grid-cols-3"
          >
            {CONEXION.map((paso, i) => (
              <motion.li key={paso.num} variants={item} className="flex flex-col">
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sage/10 text-sage font-body text-[14px] font-medium mb-3"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h4 className="font-display text-ink text-[17px] mb-2" style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}>
                  {paso.titulo}
                </h4>
                <p className="font-body text-[15px] leading-[1.6] text-ink/72">
                  {paso.texto}
                </p>
              </motion.li>
            ))}
          </motion.ol>

          {/* Trío de confianza, una sola vez */}
          <motion.div
            variants={item}
            className="mt-12 pt-8 border-t border-sage/15 flex flex-col sm:flex-row sm:items-start sm:justify-center gap-7 sm:gap-14"
          >
            {CONFIANZA.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center sm:gap-3"
              >
                <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                  <Icon />
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-sage mb-1.5">{title}</p>
                  <p className="font-body text-sm text-ink/75">{text}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Nota de pago + reaseguro de conexión */}
          <motion.p
            variants={item}
            className="mt-10 font-body text-[16px] text-ink/75 text-center max-w-[52ch] mx-auto leading-relaxed"
          >
            {PROCESO_ONLINE.notaPago}
          </motion.p>
          <motion.p
            variants={item}
            className="mt-3 font-body text-[15px] italic text-ink/72 text-center max-w-[50ch] mx-auto leading-relaxed"
          >
            {PROCESO_ONLINE.cierre}
          </motion.p>
        </motion.div>

        {/* CTA final */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-12 flex justify-center"
        >
          <motion.div variants={item}>
            <Button size="lg" variant="primary" onClick={openTipoSesionModal}>
              Agendar tu sesión
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
