import React, { useId, useState } from 'react';
import Button from '../ui/Button';

/**
 * RespiraVisor (C24 fixpack): caleidoscopio generativo que pauta la respiración.
 *
 * Qué lo hace caleidoscopio de verdad y no una estrella:
 * 1. Simetría especular: cada celda contiene una media-hoja ASIMÉTRICA y su
 *    reflejo (translate(420 0) scale(-1 1) espeja respecto del eje x=210).
 *    El par espejo crea las "alas" clásicas del caleidoscopio.
 * 2. Aleatoriedad acotada y continua: se sortean formas, colores, opacidades,
 *    cantidad de segmentos, velocidades y sentidos de giro. Y no solo al
 *    montar: al empezar cada inhalación y cada exhalación se sortea una
 *    figura NUEVA, como al girar el tubo de un caleidoscopio. Nunca es la
 *    misma figura agrandándose y achicándose.
 * 3. El cambio entra por fundido cruzado: hay dos ranuras de figura y en cada
 *    cambio de fase la oculta recibe la figura nueva y cruza opacidades con
 *    la saliente (2,6 s), de modo que la transición acompaña en vez de saltar.
 *    El reloj del cambio es un marcador CSS invisible de 5,5 s (media fase,
 *    .respira-fase): su animationiteration comparte play-state con el resto,
 *    así que pausar también congela los sorteos y no hay deriva entre figura
 *    y palabras.
 *
 * Lo que la aleatoriedad NO puede tocar (criterios del ciclo):
 * - El ritmo: el ciclo de respiración es fijo, 11 s (5,5 s + 5,5 s), y la
 *   escala del conjunto sigue siendo la señal dominante. El giro es lentísimo
 *   y subordinado, para no competir con la pauta.
 * - La calma: paleta de marca con opacidades techo 0.3, sin animar color ni
 *   opacidad de las formas individuales (el fundido es del conjunto y es
 *   lento), sin destellos ni saltos de luminancia.
 * - La accesibilidad: arranca en pausa, pausar congela (animation-play-state),
 *   y con prefers-reduced-motion la figura queda fija y sin resorteos (única
 *   por visita) y el ritmo lo marcan solo las palabras.
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

// Media-hoja asimétrica desde el centro (210,210). El sesgo inclina la punta;
// el espejo de la celda convierte esa asimetría en un par de alas.
function hojaPath() {
  const largo = alea(116, 158);
  const ancho = alea(10, 26);
  const sesgo = alea(4, 18);
  const x0 = 210;
  const y0 = 210;
  const tx = x0 + sesgo;
  const ty = y0 - largo;
  return [
    `M ${x0} ${y0}`,
    `C ${r1(x0 - ancho)} ${r1(y0 - largo * 0.35)},`,
    `${r1(tx - ancho * 0.7)} ${r1(ty + largo * 0.25)},`,
    `${r1(tx)} ${r1(ty)}`,
    `C ${r1(tx + ancho * 0.45)} ${r1(ty + largo * 0.3)},`,
    `${r1(x0 + ancho * 0.55)} ${r1(y0 - largo * 0.3)},`,
    `${x0} ${y0} Z`,
  ].join(' ');
}

function generarCaleidoscopio() {
  const hojas = Array.from({ length: elegir([2, 3]) }, () => {
    const c = elegir(PALETA);
    return { d: hojaPath(), fill: c.fill, op: r1(alea(c.op[0], c.op[1])) };
  });
  const puntos = Array.from({ length: elegir([1, 2]) }, () => {
    const c = elegir(PALETA);
    return {
      cx: r1(210 + alea(-14, 14)),
      cy: r1(210 - alea(72, 150)),
      r: r1(alea(3.5, 8)),
      fill: c.fill,
      op: r1(alea(0.18, 0.3)),
    };
  });
  const velos = Array.from({ length: 2 }, () => {
    const c = elegir(PALETA);
    return {
      cx: r1(210 + alea(-10, 10)),
      cy: r1(210 - alea(60, 112)),
      rx: r1(alea(26, 50)),
      ry: r1(alea(78, 138)),
      rot: r1(alea(-16, 16)),
      fill: c.fill,
      op: r1(alea(0.05, 0.1)),
    };
  });
  const dirA = elegir(['normal', 'reverse']);
  return {
    segA: elegir([10, 12, 14]),
    segB: elegir([6, 8]),
    hojas,
    puntos,
    velos,
    durA: Math.round(alea(95, 150)),
    durB: Math.round(alea(160, 230)),
    dirA,
    dirB: dirA === 'normal' ? 'reverse' : 'normal',
  };
}

export default function RespiraVisor() {
  const [running, setRunning] = useState(false);
  // Dos ranuras de figura: la activa se ve, la otra espera oculta el próximo
  // sorteo. Lazy initializer: ambas se sortean una vez al montar.
  const [vista, setVista] = useState(() => ({
    activa: 0,
    figuras: [generarCaleidoscopio(), generarCaleidoscopio()],
  }));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const idCentro = `centro-${uid}`;

  // Inicio de cada inhalación y de cada exhalación (lo avisa el marcador
  // .respira-fase): la ranura oculta recibe una figura recién sorteada y pasa
  // a ser la visible; el fundido cruzado lo hace el CSS.
  const cambiarFigura = () => {
    setVista((v) => {
      const entrante = 1 - v.activa;
      const figuras = [...v.figuras];
      figuras[entrante] = generarCaleidoscopio();
      return { activa: entrante, figuras };
    });
  };

  return (
    <div className={`respira-visor ${running ? 'is-running' : ''}`}>
      <div className="respira-stage" aria-hidden="true">
        {/* Marcador de fase: invisible, su animación dura media ciclo (5,5 s)
            y cada iteración marca el inicio de una inhalación o exhalación. */}
        <span className="respira-fase" onAnimationIteration={cambiarFigura} />
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

          {/* Todo el conjunto respira (escala). Dentro, las dos ranuras de
              figura cruzan opacidades en cada fase y, dentro de cada figura,
              dos capas giran en sentidos opuestos a velocidades sorteadas. */}
          <g className="respira-breath">
            {vista.figuras.map((k, ranura) => {
              const idCeldaA = `celdaA-${uid}-${ranura}`;
              const idCeldaB = `celdaB-${uid}-${ranura}`;
              return (
                <g
                  key={ranura}
                  className={`respira-figura${ranura === vista.activa ? ' is-activa' : ''}`}
                >
                  <defs>
                    {/* Celda de la capa principal: hojas + puntos sorteados */}
                    <g id={idCeldaA}>
                      {k.hojas.map((h, i) => (
                        <path key={i} d={h.d} fill={h.fill} opacity={h.op} />
                      ))}
                      {k.puntos.map((p, i) => (
                        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={p.op} />
                      ))}
                    </g>
                    {/* Celda de la capa de fondo: velos translúcidos grandes */}
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
                  <g
                    className="respira-rotor"
                    style={{ '--giro-dur': `${k.durB}s`, '--giro-dir': k.dirB }}
                  >
                    {Array.from({ length: k.segB }, (_, i) => (
                      <g key={i} transform={`rotate(${(360 / k.segB) * i} 210 210)`}>
                        <use href={`#${idCeldaB}`} />
                        <use href={`#${idCeldaB}`} transform="translate(420 0) scale(-1 1)" />
                      </g>
                    ))}
                  </g>
                  <g
                    className="respira-rotor"
                    style={{ '--giro-dur': `${k.durA}s`, '--giro-dir': k.dirA }}
                  >
                    {Array.from({ length: k.segA }, (_, i) => (
                      <g key={i} transform={`rotate(${(360 / k.segA) * i} 210 210)`}>
                        <use href={`#${idCeldaA}`} />
                        <use href={`#${idCeldaA}`} transform="translate(420 0) scale(-1 1)" />
                      </g>
                    ))}
                  </g>
                </g>
              );
            })}
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
        </svg>

        {/* Palabras guía superpuestas (el lector de pantalla recibe el estado
            por la región aria-live de abajo, no por esto). */}
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
