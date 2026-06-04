import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CAL_USERNAME, CAL_EVENTS } from '../../lib/cal';
import { useUI } from '../../lib/uiContext';
import Button from '../ui/Button';

const WEBPAY_PAGO_URL = 'https://www.webpay.cl/form-pay/388212';

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
  'Código 09 08 101 para usuarios nuevos',
  'Plataforma de videollamada segura certificada por Fonasa (Doxy.me)',
];

const SECONDARY_CARD_SHADOW = {
  border: '1px solid rgba(63, 91, 74, 0.18)',
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
      ref={ref}
      className="bg-cream py-16 md:py-20 px-6"
    >
      <motion.div
        className="max-w-5xl mx-auto"
        variants={container}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="text-center mb-12 md:mb-16 max-w-2xl mx-auto"
        >
          <p className="text-sage text-[13px] uppercase tracking-[0.18em] font-body mb-4">
            Precios transparentes
          </p>
          <h2
            className="font-display text-4xl md:text-5xl text-ink mb-5"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            Precios y formas de pago
          </h2>
          <p className="font-body text-lg text-ink/75 leading-relaxed">
            Misma duración y dedicación, independiente del modo de pago.
          </p>
        </motion.div>

        {/* Grid 1 + 3 en desktop: destacada a la izquierda, tres apiladas a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-start">
          {/* Columna izquierda: card destacada (se dimensiona a su contenido,
              sin estirarse a la altura de las tres apiladas: evita el hueco). */}
          <motion.article
            variants={item}
            className="relative bg-offwhite rounded-2xl p-8 md:p-10 flex flex-col"
            style={{
              border: '1.5px solid #C97B5E',
              boxShadow:
                '0 1px 3px rgba(201, 123, 94, 0.08), 0 12px 32px rgba(201, 123, 94, 0.08)',
            }}
          >
            <span className="absolute -top-3 left-6 bg-terracotta text-cream font-body text-[12px] font-medium tracking-[0.02em] px-3 py-1.5 rounded-full select-none">
              Para tu primera sesión
            </span>

            <h3 className="font-display text-xl text-ink mb-6 mt-2">
              Primera sesión con bono Fonasa
            </h3>

            <div className="mb-8">
              <p
                className="font-display text-5xl md:text-6xl text-ink leading-none mb-2"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                $5.570
              </p>
              <p className="font-body text-[16px] text-sage">
                Copago Modalidad Libre Elección
              </p>
            </div>

            <ul className="space-y-3 mb-5">
              {FEATURES_FONASA_PRIMERA.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 font-body text-[16px] text-ink/80 leading-snug"
                >
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="font-body text-[15px] text-ink/60 leading-relaxed mb-7">
              Compras el bono antes de la sesión y me envías el folio por WhatsApp (o una foto donde se vea el número).
            </p>

            <button
              type="button"
              onClick={() => openFonasaModal()}
              className="font-body text-[15px] text-sage hover:text-[#2F4538] underline decoration-sage/30 hover:decoration-sage underline-offset-4 mb-5 self-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-sm"
            >
              Ver guía paso a paso para comprar el bono →
            </button>

            <div className="mt-auto">
              <Button
                calLink={`${CAL_USERNAME}/${CAL_EVENTS.primeraSesionFonasa}`}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Agendar primera sesión Fonasa
              </Button>
            </div>
          </motion.article>

          {/* Columna derecha: tres cards apiladas */}
          <div className="flex flex-col gap-6 lg:gap-8">
            {/* Sesión de avance (Fonasa) */}
            <motion.article
              variants={item}
              className="bg-offwhite rounded-2xl p-6 md:p-7 flex flex-col"
              style={SECONDARY_CARD_SHADOW}
            >
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
                <span className="font-body text-[16px] text-sage ml-3">
                  Copago Modalidad Libre Elección
                </span>
              </p>
              <p className="font-body text-[16px] text-ink/70 leading-relaxed mb-5">
                Para pacientes que ya iniciaron tratamiento conmigo. Código 09 08 102, sesión de 45 minutos.
              </p>
              <div className="mt-auto">
                <Button
                  calLink={`${CAL_USERNAME}/${CAL_EVENTS.controlAvanceFonasa}`}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  Agendar sesión de avance
                </Button>
              </div>
            </motion.article>

            {/* Terapia de pareja (Fonasa) */}
            <motion.article
              variants={item}
              className="bg-offwhite rounded-2xl p-6 md:p-7 flex flex-col"
              style={SECONDARY_CARD_SHADOW}
            >
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
                <span className="font-body text-[16px] text-sage ml-3">
                  Copago Modalidad Libre Elección
                </span>
              </p>
              <p className="font-body text-[16px] text-ink/70 leading-relaxed mb-5">
                Código 09 08 103. Sesión de 45 minutos con ambos miembros presentes.
              </p>
              <div className="mt-auto">
                <Button
                  calLink={`${CAL_USERNAME}/${CAL_EVENTS.parejaFonasa}`}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  Agendar sesión de pareja
                </Button>
              </div>
            </motion.article>

            {/* Sesión particular */}
            <motion.article
              variants={item}
              className="bg-offwhite rounded-2xl p-6 md:p-7 flex flex-col"
              style={SECONDARY_CARD_SHADOW}
            >
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
                <span className="font-body text-[16px] text-sage ml-3">
                  Con transferencia electrónica o WebPay
                </span>
              </p>
              <p className="font-body text-[16px] text-ink/70 leading-relaxed mb-5">
                Sin previsión requerida. Comprobante para reembolso de Isapre cuando aplique.
              </p>
              <div className="mt-auto flex flex-col gap-4">
                <Button
                  calLink={`${CAL_USERNAME}/${CAL_EVENTS.particular15000}`}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  Agendar particular
                </Button>

                {/* Pago WebPay: form POST oficial. Sale directo a WebPay (sin
                    preventDefault) y abre en pestaña nueva para no perder el sitio.
                    El SVG del botón se sirve local desde /public (sin hotlinking). */}
                <div className="flex flex-col gap-3 pt-4 border-t border-sage/15">
                  <p className="font-body text-[14px] text-ink/60 leading-snug">
                    ¿Prefieres pagar ahora? Hazlo con WebPay:
                  </p>
                  <div className="flex items-center gap-4">
                    <form
                      method="post"
                      action="https://www.webpay.cl/backpub/external/form-pay"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <input type="hidden" name="idFormulario" value="388212" />
                      <input type="hidden" name="monto" value="15000" />
                      <input
                        type="image"
                        name="button1"
                        src="/boton-webpay.svg"
                        alt="Pagar la sesión particular de $15.000 con WebPay"
                        title="Pagar con WebPay"
                        className="block transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite rounded-md"
                        style={{ height: 56, width: 'auto' }}
                      />
                    </form>

                    {/* QR: solo escritorio (escanear la pantalla del propio teléfono
                        no sirve en mobile; ahí basta el botón de arriba). */}
                    <a
                      href={WEBPAY_PAGO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Pagar con WebPay escaneando el código QR con tu teléfono"
                      className="hidden md:flex flex-shrink-0 rounded-lg p-1.5 bg-offwhite ring-1 ring-sage/20 hover:ring-sage/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light"
                    >
                      <img
                        src="/webpay-qr.png"
                        alt="Código QR para pagar con WebPay"
                        width={128}
                        height={128}
                        loading="lazy"
                        decoding="async"
                        style={{ display: 'block', width: 128, height: 128 }}
                      />
                    </a>
                  </div>
                  <p className="hidden md:block font-body text-[14px] text-ink/55 leading-snug">
                    Pulsa el botón, o escanea el código con tu teléfono.
                  </p>
                </div>
              </div>
            </motion.article>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
