import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { CAL_USERNAME, FALLBACK_PARTICULAR_CTA } from '../../lib/cal';
import { PRECIOS } from '../../lib/precios';
import { useUI } from '../../lib/uiContext';

// La foto del hero se sirve desde /public con nombre fijo (juan-720.webp /
// juan-720.jpg) para que coincida EXACTAMENTE con el <link rel="preload"> de
// index.html. Así el navegador la descubre y descarga desde el parseo del HTML,
// sin esperar a que React monte el componente (era la causa del LCP alto).
//
// C24: este componente ya no importa Framer Motion. La entrada escalonada y la
// rotación de la frase del H1 se hacen con CSS (clases anim-rise / hero-rotor
// en index.css) más un intervalo mínimo de React para alternar la frase.
// Motivo: Hero es eager (LCP); sacar Framer de aquí, del Header y del modal
// deja la librería solo en chunks diferidos y reduce el JS del bundle crítico.

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '56973394530';
const WA_MESSAGE = encodeURIComponent(
  'Hola Juan, vi tu sitio y me gustaría conversar sobre una primera sesión.'
);
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const PARTICULAR_CAL_LINK = `${CAL_USERNAME}/${FALLBACK_PARTICULAR_CTA}`;

// Frases que rotan en el cierre del H1. La primera se renderiza en la carga
// (es el LCP y lo que lee Google). La más larga reserva la altura del bloque.
const ROTATING = [
  'un espacio donde eres protagonista',
  'sin salir de casa, a tu propio ritmo',
  'acompañamiento sin prejuicios',
];
const LONGEST = 'sin salir de casa, a tu propio ritmo';
const ROTATE_MS = 4500;
const LEAVE_MS = 300;

// Detección de prefers-reduced-motion sin depender de Framer.
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduce;
}

export default function Hero() {
  const reduce = usePrefersReducedMotion();
  const { openTipoSesionModal } = useUI();
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let to;
    const t = setInterval(() => {
      setLeaving(true);
      to = setTimeout(() => {
        setIdx((i) => (i + 1) % ROTATING.length);
        setLeaving(false);
      }, LEAVE_MS);
    }, ROTATE_MS);
    return () => {
      clearInterval(t);
      clearTimeout(to);
    };
  }, [reduce]);

  // Escalonado de entrada: mismo ritmo que el stagger anterior (80 ms).
  const delay = (ms) => ({ animationDelay: `${ms}ms` });

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

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8 pt-8 lg:pt-14 pb-12 lg:pb-16">
        <div className="flex flex-col-reverse gap-8 lg:gap-12 lg:grid lg:grid-cols-5 lg:items-center">
          {/* Columna texto */}
          <div className="lg:col-span-3">
            <span
              className="anim-rise inline-flex items-center gap-2 font-body text-[13px] uppercase tracking-[0.2em] text-sage mb-5"
              style={delay(50)}
            >
              <span className="w-6 h-px bg-sage" aria-hidden="true" />
              Terapia online en Chile
            </span>

            <h1
              className="anim-rise font-display text-ink"
              style={{
                ...delay(130),
                fontWeight: 600,
                fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
                fontSize: 'clamp(2.1rem, 5.2vw, 3.6rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.015em',
                textWrap: 'balance',
              }}
            >
              Terapia psicológica online,
              {/* Bloque rotante: el ghost reserva altura para evitar saltos (CLS 0). */}
              <span className="block relative mt-1">
                <span className="invisible" aria-hidden="true">
                  {LONGEST}
                </span>
                <span className="absolute inset-0">
                  <span
                    key={idx}
                    className={`hero-rotor italic text-sage ${leaving ? 'is-leaving' : ''}`}
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}
                  >
                    {ROTATING[idx]}
                  </span>
                </span>
              </span>
            </h1>

            <p
              className="anim-rise mt-6 font-body text-[18px] lg:text-[20px] leading-[1.6] text-ink/80 max-w-[40ch]"
              style={delay(210)}
            >
              Trabajemos lo que hoy te limita y dale un nuevo sentido a lo que vives. Sesiones de 45 minutos por videollamada segura, con bono Fonasa o particular.
            </p>

            <div
              className="anim-rise mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
              style={delay(290)}
            >
              <Button size="lg" variant="primary" onClick={openTipoSesionModal}>
                Agendar tu sesión
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
            </div>

            {/* Microcopy: aclara restricción y ofrece ruta alternativa sin abandonar el fold. */}
            <p
              className="anim-rise mt-3 font-body text-[15px] text-ink/75"
              style={delay(370)}
            >
              Primera sesión con bono Fonasa: copago {PRECIOS.fonasaCopago.display}.{' '}
              <button
                type="button"
                data-cal-link={PARTICULAR_CAL_LINK}
                data-cal-namespace="psicojuan"
                data-cal-config='{"layout":"month_view"}'
                onClick={() => {
                  // Fallback: si Cal aún no está inicializado, abre la URL directa.
                  if (typeof window !== 'undefined' && !window.Cal) {
                    window.open(`https://cal.com/${PARTICULAR_CAL_LINK}`, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="underline decoration-sage/40 underline-offset-2 hover:text-ink hover:decoration-sage transition-colors"
              >
                ¿Sin Fonasa? Ver sesión particular ({PRECIOS.particular.display}) →
              </button>
            </p>

            <ul
              className="anim-rise mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-body text-[15px] lg:text-[16px] text-sage"
              style={delay(450)}
            >
              <li>Psicólogo clínico titulado</li>
              <li aria-hidden="true" className="text-sage/50">·</li>
              <li>Inscrito en Fonasa</li>
              <li aria-hidden="true" className="text-sage/50">·</li>
              <li>Videollamada cifrada</li>
            </ul>
          </div>

          {/* Columna foto: borde fino sage definido (sin marco de relleno offwhite,
              que se leía como marco pálido de bajo contraste). Mobile más grande
              para reforzar la señal de competencia del headshot sin que domine el CTA. */}
          <div className="anim-fade lg:col-span-2" style={delay(200)}>
            <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none">
              <div
                className="relative w-full overflow-hidden rounded-2xl ring-1 ring-sage/30 shadow-[0_36px_70px_-28px_rgba(63,91,74,0.45),0_20px_44px_-26px_rgba(201,123,94,0.3)]"
              >
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-sage-light/15"
                  style={{ aspectRatio: '4 / 5' }}
                >
                  <picture>
                    <source srcSet="/juan-720.webp" type="image/webp" />
                    <img
                      src="/juan-720.jpg"
                      alt="Juan Fernández, psicólogo clínico"
                      width={720}
                      height={964}
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </picture>

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentinel heredado (ya no controla el header fijo, pero no estorba) */}
      <div id="hero-end-sentinel" aria-hidden="true" className="absolute bottom-0 h-px w-px" />
    </section>
  );
}
