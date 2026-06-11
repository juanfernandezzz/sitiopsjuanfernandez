import React, { useId, useState } from 'react';
import Button from '../ui/Button';
import '../../respira.css';

/**
 * RespiraVisor (C24 fixpack 2): caleidoscopio de morfosis geométrica continua.
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
 *    extenso bese exactamente RADIO_OBJETIVO a inhalación completa; un
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

const alea = (min, max) => min + Math.random() * (max - min);
const r1 = (n) => Math.round(n * 10) / 10;
const elegir = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Paleta de marca con techo de opacidad por color (seguridad visual).
const PALETA = [
  { fill: '#3F5B4A', op: [0.1, 0.18] },
  { fill: '#A8B5A0', op: [0.16, 0.26] },
  { fill: '#C97B5E', op: [0.1, 0.18] },
  { fill: '#A4583B', op: [0.1, 0.16] },
];

// Radio que el elemento más extenso besa a inhalación completa
// (disco r=206, aire de 14 px hasta el anillo).
const RADIO_OBJETIVO = 192;

// Media-hoja asimétrica desde el centro; el espejo la convierte en ala.
function hoja() {
  const largo = alea(116, 158);
  const ancho = alea(10, 26);
  const sesgo = alea(4, 18);
  const x0 = 210;
  const y0 = 210;
  const tx = x0 + sesgo;
  const ty = y0 - largo;
  const d = [
    `M ${x0} ${y0}`,
    `C ${r1(x0 - ancho)} ${r1(y0 - largo * 0.35)},`,
    `${r1(tx - ancho * 0.7)} ${r1(ty + largo * 0.25)},`,
    `${r1(tx)} ${r1(ty)}`,
    `C ${r1(tx + ancho * 0.45)} ${r1(ty + largo * 0.3)},`,
    `${r1(x0 + ancho * 0.55)} ${r1(y0 - largo * 0.3)},`,
    `${x0} ${y0} Z`,
  ].join(' ');
  return { d, ext: Math.hypot(sesgo, largo) };
}

function generarCaleidoscopio() {
  const hojas = Array.from({ length: elegir([2, 3]) }, () => {
    const c = elegir(PALETA);
    const h = hoja();
    return { ...h, fill: c.fill, op: r1(alea(c.op[0], c.op[1])) };
  });
  const puntos = Array.from({ length: elegir([2, 3]) }, () => {
    const c = elegir(PALETA);
    const cx = r1(210 + alea(-14, 14));
    const cy = r1(210 - alea(72, 150));
    const r = r1(alea(3.5, 8));
    return {
      cx, cy, r,
      ext: Math.hypot(cx - 210, cy - 210) + r,
      fill: c.fill,
      op: r1(alea(0.18, 0.3)),
    };
  });
  const velos = Array.from({ length: 2 }, () => {
    const c = elegir(PALETA);
    const cx = r1(210 + alea(-10, 10));
    const cy = r1(210 - alea(55, 100));
    const rx = r1(alea(26, 48));
    const ry = r1(alea(70, 115));
    return {
      cx, cy, rx, ry,
      ext: Math.hypot(cx - 210, cy - 210) + Math.max(rx, ry),
      rot: r1(alea(-16, 16)),
      fill: c.fill,
      op: r1(alea(0.05, 0.1)),
    };
  });

  // Normalización: TODO sorteo besa el mismo radio. Ni figuras perdidas en
  // el disco ni pétalos desbordados, para cualquier combinación aleatoria.
  const extMax = Math.max(
    ...hojas.map((h) => h.ext),
    ...puntos.map((p) => p.ext),
    ...velos.map((v) => v.ext)
  );
  const ajuste = Math.round((RADIO_OBJETIVO / extMax) * 1000) / 1000;

  const dirA = elegir(['normal', 'reverse']);
  return {
    segA: elegir([10, 12, 14]),
    segB: elegir([6, 8]),
    hojas, puntos, velos, ajuste,
    // Periodos lentos y mutuamente inconmensurables.
    durA: Math.round(alea(95, 150)),
    durB: Math.round(alea(160, 230)),
    durC: Math.round(alea(53, 89)),
    durT: Math.round(alea(34, 52)),
    durP: Math.round(alea(31, 47)),
    dirA,
    dirB: dirA === 'normal' ? 'reverse' : 'normal',
    // Fases iniciales aleatorias: ni dos visitas empiezan igual.
    faseA: r1(alea(0, 150)),
    faseB: r1(alea(0, 230)),
    faseC: r1(alea(0, 89)),
    faseT: r1(alea(0, 52)),
    faseP: r1(alea(0, 47)),
    // Apertura máxima de la tijera de alas.
    tdeg: r1(alea(4, 9)),
  };
}

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
    <div className={`respira-visor ${running ? 'is-running' : ''}`}>
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
