import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CAL_USERNAME, CAL_EVENTS } from '../../lib/cal';
import { PRECIOS } from '../../lib/precios';
import { SESIONES } from '../../lib/sesiones';
import { useUI } from '../../lib/uiContext';
import Button from '../ui/Button';
import VeloSinCupos from '../ui/EtiquetaSinCupos';

// La disponibilidad se lee de la fuente unica (lib/sesiones.js), no se repite
// aqui: al quitar la bandera alla, esta card vuelve sola a su estado normal.
// C52: la bandera se deriva por clave, no se escribe a mano. Antes existia
// una sola constante atada a 'parejaFonasa', asi que marcar otra sesion sin
// cupos en sesiones.js no tenia ningun efecto aqui. Ese fue el punto de
// conmutacion que quedo suelto en el primer intento de C52.
const sinCuposDe = (clave) => SESIONES.some((s) => s.key === clave && s.sinCupos);
const PAREJA_SIN_CUPOS = sinCuposDe('parejaFonasa');
const FONASA_PRIMERA_SIN_CUPOS = sinCuposDe('primeraSesionFonasa');

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

const FEATURES_PARTICULAR = [
  'Sesión de 45 minutos por videollamada',
  'Para cualquier previsión de salud, o ninguna',
  'Boleta de honorarios para pedir reembolso en tu Isapre o seguro',
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
            ¿Cuánto cuesta la terapia online?
          </h2>
          <p className="font-body text-lg text-ink/75 leading-relaxed">
            {`La sesión particular cuesta ${PRECIOS.particular.display} y la pagas después, por transferencia. La atención con bono Fonasa sigue explicada más abajo, aunque por ahora no tengo cupos de ingreso.`}
          </p>
        </motion.div>

        {/* Grid 1 + 3 en desktop: destacada a la izquierda, tres apiladas a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-start">
          {/* C52: la destacada pasa a ser la sesion particular. El ingreso
              Fonasa esta cerrado, asi que dejarlo en el lugar mas grande de la
              pagina con un boton vivo mandaba gente a reservar algo que el
              resto del sitio ya declara sin cupos. */}
          <motion.article
            variants={item}
            className="relative bg-offwhite rounded-2xl p-8 md:p-10 flex flex-col"
            style={{
              border: '1.5px solid #C97B5E',
              boxShadow:
                '0 1px 3px rgba(201, 123, 94, 0.08), 0 12px 32px rgba(201, 123, 94, 0.08)',
            }}
          >
            <span className="absolute -top-3 left-6 bg-terracotta-deep text-cream font-body text-[12px] font-medium tracking-[0.02em] px-3 py-1.5 rounded-full select-none">
              Agenda abierta
            </span>

            <h3 className="font-display text-xl text-ink mb-6 mt-2">
              Sesión particular
            </h3>

            <div className="mb-8">
              <p
                className="font-display text-5xl md:text-6xl text-ink leading-none mb-2"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                {PRECIOS.particular.display}
              </p>
              <p className="font-body text-[16px] text-sage">
                Con transferencia electrónica o WebPay
              </p>
            </div>

            <ul className="space-y-3 mb-5">
              {FEATURES_PARTICULAR.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 font-body text-[16px] text-ink/80 leading-snug"
                >
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="font-body text-[15px] text-ink/75 leading-relaxed mb-7">
              Si tienes Isapre, otra previsión o ninguna. El pago se coordina por WhatsApp y puede ser después de la sesión.
            </p>

            <div className="mt-auto flex flex-col gap-4">
              <Button
                calLink={`${CAL_USERNAME}/${CAL_EVENTS.particular}`}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Agendar sesión particular
              </Button>

              {/* Pago WebPay: form POST oficial. Sale directo a WebPay (sin
                  preventDefault) y abre en pestaña nueva para no perder el sitio.
                  El SVG del botón se sirve local desde /public (sin hotlinking). */}
              <div className="flex flex-col gap-3 pt-4 border-t border-sage/15">
                <p className="font-body text-[14px] text-ink/75 leading-snug">
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
                    <input type="hidden" name="monto" value={PRECIOS.particular.montoWebpay} />
                    <input
                      type="image"
                      name="button1"
                      src="/boton-webpay.svg"
                      alt={`Pagar la sesión particular de ${PRECIOS.particular.display} con WebPay`}
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
                <p className="hidden md:block font-body text-[14px] text-ink/75 leading-snug">
                  Pulsa el botón, o escanea el código con tu teléfono.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Columna derecha: las dos modalidades Fonasa, apiladas */}
          <div className="flex flex-col gap-6 lg:gap-8">
            {/* Primera sesión con bono Fonasa */}
            <motion.article
              variants={item}
              className="relative bg-offwhite rounded-2xl p-6 md:p-7 flex flex-col"
              style={SECONDARY_CARD_SHADOW}
            >
              {FONASA_PRIMERA_SIN_CUPOS && <VeloSinCupos />}

              <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                <h3 className="font-display text-lg text-ink">
                  Primera sesión con bono Fonasa
                </h3>
                {/* C31: logo institucional de Fonasa como señal simbólica de
                    confianza. El archivo oficial vive en public/logos/; si
                    faltara, la imagen se oculta sola. */}
                <img
                  src="/logos/fonasa.svg"
                  alt="Fonasa"
                  width={96}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-auto flex-shrink-0 mt-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="mb-2">
                <span
                  className="font-display text-2xl md:text-3xl text-ink"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {PRECIOS.fonasaCopago.display}
                </span>
                <span className="font-body text-[16px] text-sage ml-3">
                  Copago Modalidad Libre Elección
                </span>
              </p>
              <p className="font-body text-[16px] text-ink/70 leading-relaxed mb-5">
                Código 09 08 101. Sesión de 45 minutos para afiliados de los tramos B, C y D.
                {FONASA_PRIMERA_SIN_CUPOS && (
                  <>
                    {' '}
                    Por ahora no tengo cupos de ingreso con bono Fonasa. Sigo
                    atendiendo a quienes ya están en tratamiento, y las sesiones
                    particulares tienen agenda abierta.
                  </>
                )}
              </p>

              <button
                type="button"
                onClick={() => openFonasaModal()}
                className="font-body text-[15px] text-sage hover:text-[#2F4538] underline decoration-sage/30 hover:decoration-sage underline-offset-4 mb-5 self-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-sm"
              >
                Ver guía paso a paso para comprar el bono →
              </button>

              <div className="mt-auto">
                {/* Sin cupos: el boton desaparece del DOM, no queda un CTA
                    detras del velo que alguien pueda alcanzar con el teclado. */}
                {!FONASA_PRIMERA_SIN_CUPOS && (
                  <Button
                    calLink={`${CAL_USERNAME}/${CAL_EVENTS.primeraSesionFonasa}`}
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    Agendar primera sesión Fonasa
                  </Button>
                )}
              </div>
            </motion.article>

            {/* Terapia de pareja (Fonasa) */}
            <motion.article
              variants={item}
              className="relative bg-offwhite rounded-2xl p-6 md:p-7 flex flex-col"
              style={SECONDARY_CARD_SHADOW}
            >
              {PAREJA_SIN_CUPOS && <VeloSinCupos />}

              <h3 className="font-display text-lg text-ink mb-2">
                Terapia de pareja con bono Fonasa
              </h3>
              <p className="mb-2">
                <span
                  className="font-display text-2xl md:text-3xl text-ink"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {PRECIOS.fonasaCopago.display}
                </span>
                <span className="font-body text-[16px] text-sage ml-3">
                  Copago Modalidad Libre Elección
                </span>
              </p>
              <p className="font-body text-[16px] text-ink/70 leading-relaxed mb-5">
                Código 09 08 103. Sesión de 45 minutos con ambos miembros presentes.
                {PAREJA_SIN_CUPOS && (
                  <>
                    {' '}
                    Por ahora tengo la agenda de pareja cerrada. Las sesiones
                    individuales particulares siguen disponibles.
                  </>
                )}
              </p>
              <div className="mt-auto">
                {!PAREJA_SIN_CUPOS && (
                  <Button
                    calLink={`${CAL_USERNAME}/${CAL_EVENTS.parejaFonasa}`}
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    Agendar sesión de pareja
                  </Button>
                )}
              </div>
            </motion.article>
          </div>

        </div>

        {/* C36 (BLUEPRINT Fase 3): tabla resumen extraíble. Estructura semántica
            real (table/caption/th scope) para crawlers y respuesta rápida; los
            cards de arriba conservan el trabajo de conversión con sus CTAs. */}
        <motion.div variants={item} className="mt-12 lg:mt-16 overflow-x-auto">
          <table className="w-full font-body text-[15px] text-ink/85" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
            <caption className="text-left font-body text-[13px] uppercase tracking-[0.18em] text-sage pb-4">
              Resumen de valores
            </caption>
            <thead>
              <tr className="border-b border-sage/25 text-left">
                <th scope="col" className="py-3 pr-4 font-semibold text-ink">Sesión</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-ink">Código Fonasa MLE</th>
                <th scope="col" className="py-3 font-semibold text-ink">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-sage/15">
                <th scope="row" className="py-3 pr-4 font-normal text-left">Sesión particular</th>
                <td className="py-3 pr-4">No aplica</td>
                <td className="py-3">{PRECIOS.particular.display}</td>
              </tr>
              <tr className="border-b border-sage/15">
                <th scope="row" className="py-3 pr-4 font-normal text-left">
                  Primera sesión con bono Fonasa
                  {FONASA_PRIMERA_SIN_CUPOS && (
                    <span className="block text-[13px] text-sage/85 mt-0.5">
                      Sin cupos por ahora
                    </span>
                  )}
                </th>
                <td className="py-3 pr-4">09 08 101</td>
                <td className="py-3">{`${PRECIOS.fonasaCopago.display} copago`}</td>
              </tr>
              <tr className="border-b border-sage/15">
                <th scope="row" className="py-3 pr-4 font-normal text-left">
                  Sesión de pareja con bono Fonasa
                  {PAREJA_SIN_CUPOS && (
                    <span className="block text-[13px] text-sage/85 mt-0.5">
                      Sin cupos por ahora
                    </span>
                  )}
                </th>
                <td className="py-3 pr-4">09 08 103</td>
                <td className="py-3">{`${PRECIOS.fonasaCopago.display} copago`}</td>
              </tr>
            </tbody>
          </table>
          <p className="font-body text-[13.5px] text-ink/60 mt-3 leading-relaxed">
            Copago con bono Fonasa en Modalidad Libre Elección, tramos B, C y D. Valores en pesos chilenos.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
