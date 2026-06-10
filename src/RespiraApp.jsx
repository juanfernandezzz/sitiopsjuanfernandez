import React, { useState } from 'react';
import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import Button from './components/ui/Button';

/**
 * Respira conmigo (C24).
 *
 * Ejercicio visual de respiración pausada a ~6 respiraciones por minuto:
 * ciclo de 11 s (5,5 s de inhalación + 5,5 s de exhalación equilibradas),
 * el punto de convergencia de la literatura sobre respiración lenta.
 *
 * Decisiones de diseño que NO son negociables aquí:
 * - Encuadre no médico: herramienta de relajación, sin promesas de resultado.
 * - Arranca en pausa: el movimiento solo ocurre si la persona lo inicia.
 * - Pausar congela la figura (animation-play-state), no la reinicia.
 * - Sin destellos: opacidades bajas sobre cream, transiciones lentas.
 * - prefers-reduced-motion: la figura queda fija y el ritmo lo marcan
 *   solo las palabras (crossfade de opacidad), con nota visible.
 * - La animación es CSS puro (respira.css): cero librerías, cero JS por frame.
 */

const PETALOS = 12;

export default function RespiraApp() {
  const [running, setRunning] = useState(false);

  return (
    <div className="bg-cream min-h-screen flex flex-col text-ink">
      <HeaderUtilitario />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-5 md:px-8 pt-6 md:pt-10 pb-16 md:pb-20">
          {/* Cabecera */}
          <p className="font-body uppercase tracking-widest text-sage mb-3" style={{ fontSize: 13 }}>
            Una pausa para ti
          </p>
          <h1
            className="font-display text-ink text-balance mb-4"
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
            }}
          >
            Respira conmigo
          </h1>
          <p
            className="font-body text-ink/80"
            style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '58ch' }}
          >
            Un ejercicio visual para bajar el ritmo: la figura se expande cuando inhalas y se recoge cuando exhalas, a un ritmo lento, cercano a 6 respiraciones por minuto. Respira de forma suave y silenciosa, sin forzar.
          </p>

          {/* Visor */}
          <div className={`respira-visor mt-10 ${running ? 'is-running' : ''}`}>
            <div className="respira-stage" aria-hidden="true">
              <svg
                viewBox="0 0 420 420"
                className="respira-svg"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="rg-centro" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#A8B5A0" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#A8B5A0" stopOpacity="0" />
                  </radialGradient>
                  <g id="petalo">
                    <path
                      d="M210 210 C 188 158, 196 108, 210 64 C 224 108, 232 158, 210 210 Z"
                      fill="#3F5B4A"
                      opacity="0.16"
                    />
                    <path
                      d="M210 210 C 196 166, 200 126, 210 92 C 220 126, 224 166, 210 210 Z"
                      fill="#C97B5E"
                      opacity="0.18"
                    />
                    <circle cx="210" cy="86" r="7" fill="#A4583B" opacity="0.28" />
                  </g>
                </defs>

                {/* Base */}
                <circle cx="210" cy="210" r="206" fill="#FFFDF8" />
                <circle
                  cx="210"
                  cy="210"
                  r="206"
                  fill="none"
                  stroke="#3F5B4A"
                  strokeOpacity="0.18"
                  strokeWidth="1.5"
                />

                {/* Caleidoscopio: 12 pétalos en simetría rotacional. El grupo
                    respira-breath escala (inhala/exhala) y respira-rotor gira
                    muy lento para el efecto caleidoscópico, sin destellos. */}
                <g className="respira-rotor">
                  <g className="respira-breath">
                    {Array.from({ length: PETALOS }, (_, i) => (
                      <use
                        key={i}
                        href="#petalo"
                        transform={`rotate(${(360 / PETALOS) * i} 210 210)`}
                      />
                    ))}
                    <circle cx="210" cy="210" r="60" fill="url(#rg-centro)" />
                  </g>
                </g>
              </svg>

              {/* Palabras guía superpuestas (el lector de pantalla recibe el
                  estado por la región aria-live de abajo, no por esto). */}
              <p className="respira-cues font-display" aria-hidden="true">
                <span className="cue cue-inhala">Inhala</span>
                <span className="cue cue-exhala">Exhala</span>
                <span className="cue cue-reposo">Listo cuando tú quieras</span>
              </p>
            </div>

            {/* Controles */}
            <div className="respira-controles mt-6 flex flex-col items-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setRunning((r) => !r)}
                aria-pressed={running}
              >
                {running ? 'Pausar' : 'Iniciar'}
              </Button>
              <p aria-live="polite" className="sr-only">
                {running
                  ? 'Ejercicio en marcha: inhala durante 5,5 segundos y exhala durante 5,5 segundos.'
                  : 'Ejercicio en pausa.'}
              </p>
              <p className="font-body text-ink/75" style={{ fontSize: 15 }}>
                Practica entre 3 y 5 minutos, o el tiempo que te acomode.
              </p>
              <p className="respira-nota-rm font-body text-ink/75" style={{ fontSize: 14, maxWidth: '52ch', textAlign: 'center' }}>
                Tu dispositivo indica que prefieres menos movimiento: la figura queda fija y el ritmo lo marcan las palabras Inhala y Exhala.
              </p>
            </div>
          </div>

          {/* Encuadre y seguridad */}
          <p
            className="font-body text-ink/75 mt-10"
            style={{ fontSize: 15, lineHeight: 1.65, maxWidth: '58ch' }}
          >
            Esta es una herramienta de apoyo para la relajación: no es un tratamiento ni reemplaza un proceso de psicoterapia. Si sientes mareo o incomodidad, detente y vuelve a tu ritmo natural.
          </p>

          {/* Vía suave hacia agendar */}
          <div className="mt-12 bg-offwhite rounded-2xl px-6 py-8 md:px-10 md:py-10 ring-1 ring-sage/15">
            <p
              className="font-body text-ink/80 mb-5"
              style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '50ch' }}
            >
              ¿Sientes que necesitas más que una pausa? Podemos trabajarlo juntos en sesión.
            </p>
            <Button as="a" href="/#agendar" size="lg" variant="primary">
              Agendar una sesión
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
