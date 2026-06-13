import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Easing,
  AccessibilityInfo,
  AppState,
  useWindowDimensions,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import Svg, {
  G,
  Path,
  Circle,
  Ellipse,
  Defs,
  Use,
  RadialGradient,
  Stop,
  ClipPath,
} from 'react-native-svg';
import { generarCaleidoscopio, RESPIRA_RITMO } from '@contenido/respiraNucleo';
import { COLORS, FONTS } from '../theme/tokens';
import Boton from './Boton';

/**
 * RespiraVisor (app, C25): EL MISMO caleidoscopio del sitio, en nativo.
 *
 * Fuente unica: la geometria, el sorteo y los numeros del ritmo se importan de
 * @contenido/respiraNucleo (sincronizado desde src/lib/respiraNucleo.js en
 * cada install y cada OTA). Aqui no vive ningun numero del ejercicio: si el
 * nucleo cambia en el sitio, el siguiente push lo trae a la app.
 *
 * Equivalencias con el driver CSS del sitio (respira.css):
 *  - Respiracion: escala exhalado-inhalado con la misma bezier, por mitades
 *    de ciclo (en CSS la curva aplica por tramo de keyframe; aqui, por timing
 *    de cada mitad). Senal dominante.
 *  - Rotores: giro lineal infinito por capa, con duracion, sentido y fase
 *    sorteados por el nucleo (fase = animation-delay negativo del CSS).
 *  - Tijera de alas: base y espejo oscilan +-tdeg en sentidos opuestos,
 *    ease-in-out alternate.
 *  - Pulso radial: escala pulsoMin-pulsoMax, ease-in-out alternate.
 *  - Cues: Inhala visible la primera mitad, Exhala la segunda; el crossfade
 *    dura el 5% del ciclo y TERMINA en el cambio de mitad, igual que la
 *    ventana 45-50% del CSS (se agenda antes del borde de cada mitad).
 *  - Pausa: congela todo donde esta; reanudar continua del mismo punto
 *    (paridad con animation-play-state). Detalle honesto: al reanudar a mitad
 *    de un tramo, la curva del resto del tramo se re-easea sobre el tiempo
 *    restante; posicion y ritmo son continuos y la diferencia de velocidad es
 *    imperceptible a estos periodos.
 *
 * Rendimiento: cada capa movil es un Svg estatico dentro de un Animated.View;
 * todas las transformaciones (escala, giros, tijera, pulso) y los fundidos de
 * cues corren en el hilo de UI (useNativeDriver). Cero JavaScript por cuadro:
 * JS solo interviene en los bordes de tramo (cada varios segundos).
 *
 * Accesibilidad y seguridad: arranca en pausa; con reduce-motion la figura
 * queda fija en la escala de reposo del nucleo (sin giros, como el sitio, que
 * apaga las animaciones de figura) y el ritmo lo marcan las palabras; la
 * figura es decorativa para el lector de pantalla y el estado se anuncia por
 * la region viva. La pantalla no se apaga mientras el ejercicio corre.
 */

const MEDIO_MS = (RESPIRA_RITMO.cicloS * 1000) / 2;
const FADE_CUE_MS = Math.round(RESPIRA_RITMO.cicloS * 1000 * 0.05);
const EASE_RESPIRO = Easing.bezier(...RESPIRA_RITMO.bezier);
// Equivalente exacto del keyword ease-in-out de CSS.
const EASE_INOUT = Easing.bezier(0.42, 0, 0.58, 1);

// Inversa numerica de una curva de easing monotona en [0,1] (biseccion).
// Se usa al pausar: convierte el valor congelado en fraccion de tiempo del
// tramo, para que reanudar respete la duracion restante real.
function invertirEasing(E, y) {
  if (y <= 0) return 0;
  if (y >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const m = (lo + hi) / 2;
    if (E(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

// Fraccion [0,1) dentro de un periodo, a partir de una fase en segundos
// (equivalente al animation-delay negativo del CSS).
const fraccionDeFase = (faseS, durS) => (((faseS % durS) + durS) % durS) / durS;

// Estado inicial de un canal alternante (tijera, pulso) a partir de su fase:
// en que punto del vaiven esta y hacia donde va.
function estadoAlternante(faseS, durS) {
  const ciclo = 2 * durS;
  const pos = (((faseS % ciclo) + ciclo) % ciclo);
  if (pos < durS) return { tau: pos / durS, adelante: true };
  return { tau: (pos - durS) / durS, adelante: false };
}

// n segmentos en simetria rotacional; espejo agrega la copia reflejada.
// Misma composicion que la funcion segmentos() del visor web.
function Segmentos({ idCelda, n, espejo }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <G key={i} transform={`rotate(${(360 / n) * i} 210 210)`}>
          {espejo ? (
            <G transform="translate(420 0) scale(-1 1)">
              <Use href={`#${idCelda}`} />
            </G>
          ) : (
            <Use href={`#${idCelda}`} />
          )}
        </G>
      ))}
    </>
  );
}

export default function RespiraVisor() {
  const { width: anchoVentana } = useWindowDimensions();
  // Mismo dimensionado que la web: min(78vw, 400px).
  const TAM = Math.min(Math.round(anchoVentana * 0.78), 400);

  const [k] = useState(generarCaleidoscopio);
  const [corriendo, setCorriendo] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [textoReducido, setTextoReducido] = useState('inhala');

  // Canales de animacion. tau = fraccion de tiempo consumida del tramo en
  // curso; val = Animated.Value 0..1 cuyo easing vive en el timing.
  const motor = useRef(null);
  if (motor.current === null) {
    const tij0 = estadoAlternante(k.faseT, k.durT);
    const pul0 = estadoAlternante(k.faseP, k.durP);
    const valorAlternante = (e, E) => {
      const origen = e.adelante ? 0 : 1;
      const objetivo = e.adelante ? 1 : 0;
      return origen + (objetivo - origen) * E(e.tau);
    };
    motor.current = {
      canales: {
        respiro: {
          tipo: 'alternante',
          val: new Animated.Value(0),
          durMs: MEDIO_MS,
          easing: EASE_RESPIRO,
          tau: 0,
          adelante: true,
        },
        rotA: {
          tipo: 'lineal',
          val: new Animated.Value(fraccionDeFase(k.faseA, k.durA)),
          durMs: k.durA * 1000,
          easing: Easing.linear,
          tau: fraccionDeFase(k.faseA, k.durA),
        },
        rotB: {
          tipo: 'lineal',
          val: new Animated.Value(fraccionDeFase(k.faseB, k.durB)),
          durMs: k.durB * 1000,
          easing: Easing.linear,
          tau: fraccionDeFase(k.faseB, k.durB),
        },
        rotC: {
          tipo: 'lineal',
          val: new Animated.Value(fraccionDeFase(k.faseC, k.durC)),
          durMs: k.durC * 1000,
          easing: Easing.linear,
          tau: fraccionDeFase(k.faseC, k.durC),
        },
        tij: {
          tipo: 'alternante',
          val: new Animated.Value(valorAlternante(tij0, EASE_INOUT)),
          durMs: k.durT * 1000,
          easing: EASE_INOUT,
          tau: tij0.tau,
          adelante: tij0.adelante,
        },
        pul: {
          tipo: 'alternante',
          val: new Animated.Value(valorAlternante(pul0, EASE_INOUT)),
          durMs: k.durP * 1000,
          easing: EASE_INOUT,
          tau: pul0.tau,
          adelante: pul0.adelante,
        },
      },
      opInhala: new Animated.Value(0),
      opExhala: new Animated.Value(0),
      timersCue: [],
    };
  }
  const { canales, opInhala, opExhala } = motor.current;

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (vivo) setReduce(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      if (vivo) setReduce(v);
    });
    return () => {
      vivo = false;
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  // Diferencia honesta con la web: alli navegar desmonta la pagina y todo se
  // detiene solo. En tabs nativas la pantalla queda montada al cambiar de
  // pestana, asi que sin esto el ejercicio y el keep-awake seguirian corriendo
  // de fondo. Al perder el foco o irse la app a segundo plano, se pausa
  // (congelado donde esta; reanudar continua del mismo punto).
  useFocusEffect(
    useCallback(() => {
      return () => setCorriendo(false);
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') setCorriendo(false);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // La pantalla no se apaga mientras el ejercicio corre. Si el modulo
    // nativo faltara, el ejercicio sigue igual (el error se ignora).
    if (!corriendo) return undefined;
    activateKeepAwakeAsync('respira').catch(() => {});
    return () => {
      deactivateKeepAwake('respira').catch(() => {});
    };
  }, [corriendo]);

  // ---- Motor de animacion (solo sin reduce-motion) ----

  const limpiarTimers = () => {
    motor.current.timersCue.forEach((t) => clearTimeout(t));
    motor.current.timersCue = [];
  };

  const cruzarCues = (haciaInhala, durMs) => {
    Animated.parallel([
      Animated.timing(opInhala, {
        toValue: haciaInhala ? 1 : 0,
        duration: durMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(opExhala, {
        toValue: haciaInhala ? 0 : 1,
        duration: durMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // El crossfade dura el 5% del ciclo y termina justo en el cambio de mitad,
  // como la ventana 45-50% del CSS: se agenda restante - FADE_CUE_MS despues
  // de arrancar cada mitad.
  const programarCue = (c, restanteMs) => {
    const dur = Math.min(FADE_CUE_MS, restanteMs);
    const t = setTimeout(() => {
      cruzarCues(!c.adelante, dur);
    }, Math.max(0, restanteMs - dur));
    motor.current.timersCue.push(t);
  };

  const pasoAlternante = (c, conCues) => {
    const objetivo = c.adelante ? 1 : 0;
    const restante = Math.max(16, (1 - c.tau) * c.durMs);
    if (conCues) programarCue(c, restante);
    const anim = Animated.timing(c.val, {
      toValue: objetivo,
      duration: restante,
      easing: c.easing,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished) return;
      c.tau = 0;
      c.adelante = !c.adelante;
      pasoAlternante(c, conCues);
    });
  };

  const pasoLineal = (c) => {
    const restante = Math.max(16, (1 - c.tau) * c.durMs);
    const anim = Animated.timing(c.val, {
      toValue: 1,
      duration: restante,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished) return;
      c.tau = 0;
      c.val.setValue(0);
      pasoLineal(c);
    });
  };

  const arrancar = () => {
    opInhala.setValue(canales.respiro.adelante ? 1 : 0);
    opExhala.setValue(canales.respiro.adelante ? 0 : 1);
    pasoAlternante(canales.respiro, true);
    pasoLineal(canales.rotA);
    pasoLineal(canales.rotB);
    pasoLineal(canales.rotC);
    pasoAlternante(canales.tij, false);
    pasoAlternante(canales.pul, false);
  };

  const congelar = () => {
    limpiarTimers();
    Object.values(canales).forEach((c) => {
      c.val.stopAnimation((v) => {
        if (c.tipo === 'lineal') {
          c.tau = Math.min(Math.max(v, 0), 1);
          return;
        }
        const objetivo = c.adelante ? 1 : 0;
        const origen = 1 - objetivo;
        const progreso = Math.min(Math.max((v - origen) / (objetivo - origen), 0), 1);
        c.tau = invertirEasing(c.easing, progreso);
      });
    });
    opInhala.stopAnimation();
    opExhala.stopAnimation();
    opInhala.setValue(0);
    opExhala.setValue(0);
  };

  useEffect(() => {
    if (reduce || !corriendo) return undefined;
    arrancar();
    return () => congelar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, reduce]);

  useEffect(() => {
    // Reduce-motion: figura fija; el ritmo lo marcan solo las palabras.
    if (!reduce || !corriendo) return undefined;
    setTextoReducido('inhala');
    const id = setInterval(() => {
      setTextoReducido((t) => (t === 'inhala' ? 'exhala' : 'inhala'));
    }, MEDIO_MS);
    return () => clearInterval(id);
  }, [reduce, corriendo]);

  // ---- Transformaciones (mapeo lineal; el easing ya viajo en el timing) ----

  const escala = canales.respiro.val.interpolate({
    inputRange: [0, 1],
    outputRange: [RESPIRA_RITMO.escalaExhalado, RESPIRA_RITMO.escalaInhalado],
  });
  const angulo = (c, dir) =>
    c.val.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', dir === 'reverse' ? '-360deg' : '360deg'],
    });
  const angA = angulo(canales.rotA, k.dirA);
  const angB = angulo(canales.rotB, k.dirB);
  const angC = angulo(canales.rotC, k.dirB);
  const gradosTij = canales.tij.val.interpolate({
    inputRange: [0, 1],
    outputRange: [`-${k.tdeg}deg`, `${k.tdeg}deg`],
  });
  const gradosTijInv = canales.tij.val.interpolate({
    inputRange: [0, 1],
    outputRange: [`${k.tdeg}deg`, `-${k.tdeg}deg`],
  });
  const escalaPulso = canales.pul.val.interpolate({
    inputRange: [0, 1],
    outputRange: [RESPIRA_RITMO.pulsoMin, RESPIRA_RITMO.pulsoMax],
  });

  // En reduce-motion el sitio apaga las animaciones de figura: queda la
  // geometria sorteada sin giros, a la escala de reposo. Mismo trato aqui.
  const estilo = (animado) => (reduce ? null : animado);
  const norm = `translate(210 210) scale(${k.ajuste}) translate(-210 -210)`;

  const capa = StyleSheet.absoluteFill;

  return (
    <View style={styles.envoltura}>
      <View
        style={{ width: TAM, height: TAM }}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {/* Base del disco (estatica, fuera de la respiracion) */}
        <Svg width="100%" height="100%" viewBox="0 0 420 420" style={capa}>
          <Circle cx="210" cy="210" r="206" fill="#FFFDF8" />
          <Circle
            cx="210"
            cy="210"
            r="206"
            fill="none"
            stroke="#3F5B4A"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
        </Svg>

        {/* Todo el conjunto respira */}
        <Animated.View
          style={[
            capa,
            reduce
              ? { transform: [{ scale: RESPIRA_RITMO.escalaReposo }] }
              : { transform: [{ scale: escala }] },
          ]}
        >
          {/* Capa de velos */}
          <Animated.View style={[capa, estilo({ transform: [{ rotate: angB }] })]}>
            <Svg width="100%" height="100%" viewBox="0 0 420 420">
              <Defs>
                <ClipPath id="clipB">
                  <Circle cx="210" cy="210" r="206" />
                </ClipPath>
                <G id="celdaB">
                  {k.velos.map((v, i) => (
                    <Ellipse
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
                </G>
              </Defs>
              <G clipPath="url(#clipB)">
                <G transform={norm}>
                  <Segmentos idCelda="celdaB" n={k.segB} espejo={false} />
                  <Segmentos idCelda="celdaB" n={k.segB} espejo />
                </G>
              </G>
            </Svg>
          </Animated.View>

          {/* Capa de hojas con tijera de alas (base y espejo contrarrotan) */}
          <Animated.View style={[capa, estilo({ transform: [{ rotate: angA }] })]}>
            <Animated.View style={[capa, estilo({ transform: [{ rotate: gradosTij }] })]}>
              <Svg width="100%" height="100%" viewBox="0 0 420 420">
                <Defs>
                  <ClipPath id="clipA1">
                    <Circle cx="210" cy="210" r="206" />
                  </ClipPath>
                  <G id="celdaA1">
                    {k.hojas.map((h, i) => (
                      <Path key={i} d={h.d} fill={h.fill} opacity={h.op} />
                    ))}
                  </G>
                </Defs>
                <G clipPath="url(#clipA1)">
                  <G transform={norm}>
                    <Segmentos idCelda="celdaA1" n={k.segA} espejo={false} />
                  </G>
                </G>
              </Svg>
            </Animated.View>
            <Animated.View style={[capa, estilo({ transform: [{ rotate: gradosTijInv }] })]}>
              <Svg width="100%" height="100%" viewBox="0 0 420 420">
                <Defs>
                  <ClipPath id="clipA2">
                    <Circle cx="210" cy="210" r="206" />
                  </ClipPath>
                  <G id="celdaA2">
                    {k.hojas.map((h, i) => (
                      <Path key={i} d={h.d} fill={h.fill} opacity={h.op} />
                    ))}
                  </G>
                </Defs>
                <G clipPath="url(#clipA2)">
                  <G transform={norm}>
                    <Segmentos idCelda="celdaA2" n={k.segA} espejo />
                  </G>
                </G>
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Capa de acentos con pulso radial */}
          <Animated.View style={[capa, estilo({ transform: [{ rotate: angC }] })]}>
            <Animated.View style={[capa, estilo({ transform: [{ scale: escalaPulso }] })]}>
              <Svg width="100%" height="100%" viewBox="0 0 420 420">
                <Defs>
                  <ClipPath id="clipC">
                    <Circle cx="210" cy="210" r="206" />
                  </ClipPath>
                  <G id="celdaC">
                    {k.puntos.map((p, i) => (
                      <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={p.op} />
                    ))}
                  </G>
                </Defs>
                <G clipPath="url(#clipC)">
                  <G transform={norm}>
                    <Segmentos idCelda="celdaC" n={k.segA} espejo={false} />
                    <Segmentos idCelda="celdaC" n={k.segA} espejo />
                  </G>
                </G>
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Centro suave (respira, no gira) */}
          <Svg width="100%" height="100%" viewBox="0 0 420 420" style={capa}>
            <Defs>
              <RadialGradient id="centro" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#A8B5A0" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#A8B5A0" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="210" cy="210" r="60" fill="url(#centro)" />
            <Circle
              cx="210"
              cy="210"
              r="24"
              fill="none"
              stroke="#3F5B4A"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          </Svg>
        </Animated.View>

        {/* Palabras guia centradas sobre la figura */}
        <View style={[capa, styles.centro]} pointerEvents="none">
          {reduce ? (
            corriendo ? (
              <Text style={styles.cue}>{textoReducido === 'inhala' ? 'Inhala' : 'Exhala'}</Text>
            ) : (
              <Text style={styles.cue}>Comienza cuando quieras</Text>
            )
          ) : corriendo ? (
            <>
              <Animated.Text style={[styles.cue, styles.cueAbs, { opacity: opInhala }]}>
                Inhala
              </Animated.Text>
              <Animated.Text style={[styles.cue, styles.cueAbs, { opacity: opExhala }]}>
                Exhala
              </Animated.Text>
            </>
          ) : (
            <Text style={styles.cue}>Comienza cuando quieras</Text>
          )}
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controles}>
        <Boton variant="secondary" onPress={() => setCorriendo((c) => !c)}>
          {corriendo ? 'Pausar' : 'Iniciar'}
        </Boton>
        <Text accessibilityLiveRegion="polite" style={styles.estadoOculto}>
          {corriendo
            ? 'Ejercicio en marcha: inhala durante 5,5 segundos y exhala durante 5,5 segundos.'
            : 'Ejercicio en pausa.'}
        </Text>
        <Text style={styles.ayuda}>Practica entre 3 y 5 minutos, o el tiempo que te acomode.</Text>
        {reduce ? (
          <Text style={styles.notaReduce}>
            Tu dispositivo indica que prefieres menos movimiento: la figura queda fija y el ritmo lo
            marcan las palabras Inhala y Exhala.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  envoltura: { alignItems: 'center' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  cue: {
    fontFamily: FONTS.displaySoft,
    fontStyle: 'italic',
    fontSize: 24,
    color: COLORS.sage,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cueAbs: { position: 'absolute' },
  controles: {
    marginTop: 24,
    alignItems: 'center',
  },
  estadoOculto: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  ayuda: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    marginTop: 14,
    textAlign: 'center',
  },
  notaReduce: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkSoft,
    marginTop: 10,
    maxWidth: 320,
    textAlign: 'center',
    lineHeight: 20,
  },
});
