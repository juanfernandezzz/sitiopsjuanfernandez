import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { CAL_USERNAME, FALLBACK_PARTICULAR_CTA } from '../../lib/cal';
import { HERO } from '../../lib/hero';
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
const WA_MESSAGE = encodeURIComponent(HERO.mensajeWhatsApp);
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const PARTICULAR_CAL_LINK = `${CAL_USERNAME}/${FALLBACK_PARTICULAR_CTA}`;

// Frases del cierre del H1, desde la fuente unica compartida con la app. La
// primera se renderiza en la carga (es el LCP y lo que lee Google). La mas
// larga reserva la altura del bloque.
const ROTATING = HERO.rotativas;
const LONGEST = HERO.rotativaMasLarga;
const ROTATE_MS = HERO.rotacionMs;
const LEAVE_MS = HERO.salidaMs;

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
      {/* Textura de grano sutil. C31 fix pack 5: tesela PNG pre-rasterizada en
          vez de feTurbulence. El filtro SVG se rasteriza por software en
          entornos sin GPU (el runner de PageSpeed y los moviles de gama baja)
          y retiene el primer pintado; el PNG ya viene rasterizado. Sigue como
          mascara sobre color plano: las mascaras no son candidatas a LCP.
          Opacidad recalibrada (0.05 a 0.03) porque la tesela trae el alfa a
          rango completo, sin el 0.6 que traia el rect del SVG. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundColor: 'rgb(41, 59, 77)',
          WebkitMaskImage: "url('/textures/grano-128.png')",
          maskImage: "url('/textures/grano-128.png')",
        }}
      />

      {/* Acentos geométricos discretos. C31: gradiente radial en vez de circulo
          con blur-3xl; el desenfoque de 64px sobre cajas de 400px es muy caro de
          rasterizar en el primer frame (render por software en moviles de gama
          baja y en los runners de PageSpeed) y retrasaba el primer paint. El
          gradiente produce el mismo halo suave con rasterizado barato. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(168,181,160,0.20) 0%, rgba(168,181,160,0.17) 45%, rgba(168,181,160,0.07) 75%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-[-80px] w-[360px] h-[360px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(201,123,94,0.10) 0%, rgba(201,123,94,0.085) 45%, rgba(201,123,94,0.035) 75%, transparent 100%)',
        }}
      />

      {/* C39: el espaciado vertical se comprime SOLO bajo sm (640px). Motivo:
          en movil el orden visual es flex-col-reverse (foto arriba), y la suma
          de foto + separaciones empujaba el copago Fonasa unos 950px hacia
          abajo, muy por debajo del pliegue de cualquier telefono. Desde sm
          hacia arriba los valores originales quedan intactos. */}
      <div className="relative mx-auto max-w-6xl px-5 lg:px-8 pt-6 sm:pt-8 lg:pt-14 pb-12 lg:pb-16">
        <div className="flex flex-col-reverse gap-6 sm:gap-8 lg:gap-12 lg:grid lg:grid-cols-5 lg:items-center">
          {/* Columna texto */}
          <div className="lg:col-span-3">
            <span
              className="anim-rise inline-flex items-center gap-2 font-body text-[13px] uppercase tracking-[0.2em] text-sage mb-4 sm:mb-5"
              style={delay(50)}
            >
              <span className="w-6 h-px bg-sage" aria-hidden="true" />
              {HERO.eyebrow}
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
              {HERO.lineaFija}
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
              className="anim-rise mt-5 sm:mt-6 font-body text-[18px] lg:text-[20px] leading-[1.6] text-ink/80 max-w-[40ch]"
              style={delay(210)}
            >
              {HERO.sub}
            </p>

            {/* C39: el copago Fonasa sube por encima de los botones. Antes
                vivia debajo de ellos y en movil caia fuera del pliegue, que es
                justo el dato que prometen los anuncios de Google Ads. Va en su
                propio parrafo y sin interpolaciones, asi el HTML crudo entrega
                un unico nodo de texto en vez de uno partido por separadores de
                comentario (leccion C36). */}
            <p
              className="anim-rise mt-4 sm:mt-5 font-body text-[15px] lg:text-[16px] text-ink/80"
              style={delay(290)}
            >
              {HERO.microcopia}
            </p>

            <div
              className="anim-rise mt-4 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
              style={delay(370)}
            >
              <Button size="lg" variant="primary" onClick={openTipoSesionModal}>
                {HERO.ctaPrimario}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                as="a"
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
              >
                {HERO.ctaSecundario}
              </Button>
            </div>

            {/* Ruta alternativa. Se queda DESPUES del CTA principal a
                proposito: un enlace secundario sobre el boton competiria con
                la accion primaria. */}
            <p
              className="anim-rise mt-3 font-body text-[15px] text-ink/75"
              style={delay(450)}
            >
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
                {HERO.enlaceParticular}
              </button>
            </p>

            <ul
              className="anim-rise mt-6 sm:mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-body text-[15px] lg:text-[16px] text-sage"
              style={delay(530)}
            >
              {HERO.chips.map((chip, i) => (
                <React.Fragment key={chip}>
                  {i > 0 && (
                    <li aria-hidden="true" className="text-sage/50">·</li>
                  )}
                  <li>{chip}</li>
                </React.Fragment>
              ))}
            </ul>
          </div>

          {/* Columna foto: borde fino sage definido (sin marco de relleno offwhite,
              que se leía como marco pálido de bajo contraste). Mobile más grande
              para reforzar la señal de competencia del headshot sin que domine el CTA. */}
          {/* C31: la foto es el candidato LCP legitimo; sin animacion de entrada
              para que su primer paint contable no espere una opacidad en 0. El
              texto conserva su entrada escalonada. */}
          <div className="lg:col-span-2">
            <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none">
              <div
                className="relative w-full overflow-hidden rounded-2xl ring-1 ring-sage/30 shadow-[0_36px_70px_-28px_rgba(63,91,74,0.45),0_20px_44px_-26px_rgba(201,123,94,0.3)]"
              >
                {/* C39: bajo sm la foto se recorta a banda 3/2 con el encuadre
                    desplazado hacia arriba (object-position 50% 20%). El rostro
                    conserva exactamente el mismo tamano en pixeles porque el
                    ancho no cambia; lo que se recorta es el aire sobre la
                    cabeza y las piernas. Ahorra 163px de alto sobre el pliegue
                    movil. Desde sm vuelve al retrato 4/5 original. La caja
                    mantiene aspect-ratio declarado, asi que el CLS sigue en 0. */}
                <div className="relative w-full overflow-hidden rounded-2xl bg-sage-light/15 aspect-[3/2] sm:aspect-[4/5]">
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
                      className="w-full h-full object-cover object-[50%_20%] sm:object-center"
                    />
                  </picture>

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
                    style={{
                      backgroundImage: "url('/textures/grano-128.png')",
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
