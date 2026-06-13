import React, { useId, useState } from 'react';
import Button from '../ui/Button';
import { generarCaleidoscopio, RESPIRA_RITMO } from '../../lib/respiraNucleo';
import '../../respira.css';

/**
 * RespiraVisor (C24 fixpack 2; C25 extrae el nucleo): caleidoscopio de
 * morfosis geométrica continua.
 *
 * C25: la geometría, el sorteo y los números del ritmo viven ahora en
 * src/lib/respiraNucleo.js, compartidos con la app nativa (que renderiza el
 * MISMO caleidoscopio con react-native-svg). Aquí queda solo el render web y
 * su driver CSS. El ritmo se inyecta como variables CSS desde RESPIRA_RITMO;
 * respira.css las consume con fallback idéntico, así un cambio en el núcleo
 * mueve a la vez el sitio y la app.
 *
 * La figura cambia de forma TODO el tiempo, sin fundidos: solo transformaciones.
 * 1. Tres capas (velos, hojas, acentos) giran a periodos sorteados distintos y
 *    mutuamente inconmensurables (95-230 s por vuelta, sentidos mixtos): la
 *    configuración relativa nunca se repite en una sesión realista.
 * 2. Tijera de alas: las copias base y espejo de las hojas oscilan en sentidos
 *    opuestos (±4 a 9 grados, periodo 34-52 s), como girar el tubo de un
 *    caleidoscopio real.
 * 3. Pulso radial: el anillo de acentos escala 0.86-1.0 con periodo propio.
 * 4. Normalización de tamaño: cada sorteo se escala para que su elemento más
 *    extenso bese exactamente el radio objetivo a inhalación completa; un
 *    clipPath en r=206 hace imposible pintar fuera del disco.
 *
 * Lo que la aleatoriedad no toca: el ritmo (ciclo fijo de 11 s; la escala de
 * respiración sigue siendo la señal dominante: las derivas son un orden de
 * magnitud más lentas), la calma (paleta de marca, opacidades techo, cero
 * animación de color u opacidad en las formas) y la accesibilidad (arranca en
 * pausa, pausar congela todo con animation-play-state, y con
 * prefers-reduced-motion la figura queda fija e igual única por visita).
 * Cero JavaScript por frame: todo es CSS sobre grupos SVG.
 */

// Variables CSS del ritmo, derivadas del núcleo compartido. respira.css trae
// estos mismos valores como fallback: si algo fallara al inyectarlas, el
// ejercicio no cambia.
const VARS_RITMO = {
  '--respira-ciclo': `${RESPIRA_RITMO.cicloS}s`,
  '--respira-bezier': `cubic-bezier(${RESPIRA_RITMO.bezier.join(', ')})`,
  '--respira-esc-ex': RESPIRA_RITMO.escalaExhalado,
  '--respira-esc-in': RESPIRA_RITMO.escalaInhalado,
  '--respira-esc-reposo': RESPIRA_RITMO.escalaReposo,
  '--respira-pulso-min': RESPIRA_RITMO.pulsoMin,
  '--respira-pulso-max': RESPIRA_RITMO.pulsoMax,
};

export default function RespiraVisor() {
  const [running, setRunning] = useState(false);
  const [k] = useState(generarCaleidoscopio);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const idCeldaA = `celdaA-${uid}`;
  const idCeldaB = `celdaB-${uid}`;
  const idCeldaC = `celdaC-${uid}`;
  const idCentro = `centro-${uid}`;
  const idClip = `clip-${uid}`;

  // n segmentos en simetría rotacional; mir=true agrega la copia espejada.
  const segmentos = (id, n, mir) =>
    Array.from({ length: n }, (_, i) => (
      <g key={i} transform={`rotate(${(360 / n) * i} 210 210)`}>
        <use
          href={`#${id}`}
          transform={mir ? 'translate(420 0) scale(-1 1)' : undefined}
        />
      </g>
    ));

  return (
    <div className={`respira-visor ${running ? 'is-running' : ''}`} style={VARS_RITMO}>
      <div className="respira-stage" aria-hidden="true">
        <svg
          viewBox="0 0 420 420"
          className="respira-svg"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={idCentro} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A8B5A0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#A8B5A0" stopOpacity="0" />
            </radialGradient>
            <clipPath id={idClip}>
              <circle cx="210" cy="210" r="206" />
            </clipPath>
            <g id={idCeldaA}>
              {k.hojas.map((h, i) => (
                <path key={i} d={h.d} fill={h.fill} opacity={h.op} />
              ))}
            </g>
            <g id={idCeldaC}>
              {k.puntos.map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={p.op} />
              ))}
            </g>
            <g id={idCeldaB}>
              {k.velos.map((v, i) => (
                <ellipse
                  key={i}
                  cx={v.cx}
                  cy={v.cy}
                  rx={v.rx}
                  ry={v.ry}
                  fill={v.fill}
                  opacity={v.op}
                  transform={`rotate(${v.rot} 210 210)`}
                />
              ))}
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

          <g clipPath={`url(#${idClip})`}>
            {/* Todo el conjunto respira; dentro, la figura normalizada. */}
            <g className="respira-breath">
              <g transform={`translate(210 210) scale(${k.ajuste}) translate(-210 -210)`}>
                {/* Capa de velos */}
                <g
                  className="respira-rotor"
                  style={{ '--dur': `${k.durB}s`, '--dir': k.dirB, '--fase': `-${k.faseB}s` }}
                >
                  {segmentos(idCeldaB, k.segB, false)}
                  {segmentos(idCeldaB, k.segB, true)}
                </g>
                {/* Capa de hojas con tijera de alas */}
                <g
                  className="respira-rotor"
                  style={{ '--dur': `${k.durA}s`, '--dir': k.dirA, '--fase': `-${k.faseA}s` }}
                >
                  <g
                    className="respira-tijera"
                    style={{ '--tdur': `${k.durT}s`, '--tfase': `-${k.faseT}s`, '--tdeg': `${k.tdeg}deg` }}
                  >
                    {segmentos(idCeldaA, k.segA, false)}
                  </g>
                  <g
                    className="respira-tijera-inv"
                    style={{ '--tdur': `${k.durT}s`, '--tfase': `-${k.faseT}s`, '--tdeg': `${k.tdeg}deg` }}
                  >
                    {segmentos(idCeldaA, k.segA, true)}
                  </g>
                </g>
                {/* Capa de acentos con pulso radial */}
                <g
                  className="respira-rotor"
                  style={{ '--dur': `${k.durC}s`, '--dir': k.dirB, '--fase': `-${k.faseC}s` }}
                >
                  <g
                    className="respira-pulso"
                    style={{ '--pdur': `${k.durP}s`, '--pfase': `-${k.faseP}s` }}
                  >
                    {segmentos(idCeldaC, k.segA, false)}
                    {segmentos(idCeldaC, k.segA, true)}
                  </g>
                </g>
              </g>
              <circle cx="210" cy="210" r="60" fill={`url(#${idCentro})`} />
              <circle
                cx="210"
                cy="210"
                r="24"
                fill="none"
                stroke="#3F5B4A"
                strokeOpacity="0.22"
                strokeWidth="1"
              />
            </g>
          </g>
        </svg>

        {/* Palabras guía (el lector de pantalla recibe el estado por la
            región aria-live de abajo, no por esto). */}
        <p className="respira-cues font-display" aria-hidden="true">
          <span className="cue cue-inhala">Inhala</span>
          <span className="cue cue-exhala">Exhala</span>
          <span className="cue cue-reposo">Comienza cuando quieras</span>
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
        <p
          className="respira-nota-rm font-body text-ink/75"
          style={{ fontSize: 14, maxWidth: '52ch', textAlign: 'center' }}
        >
          Tu dispositivo indica que prefieres menos movimiento: la figura queda
          fija y el ritmo lo marcan las palabras Inhala y Exhala.
        </p>
      </div>
    </div>
  );
}
