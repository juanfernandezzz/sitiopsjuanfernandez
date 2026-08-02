import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  Pressable,
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
import {
  generarCaleidoscopio,
  RESPIRA_PATRONES,
  RESPIRA_RITMO,
  patronSiguiente,
} from '@contenido/respiraNucleo';
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
 * C41: dos patrones intercambiables (respiracion coherente y 4-7-8), los
 * mismos del sitio y con el mismo boton para alternar. El motor de la
 * respiracion pasa de dos mitades fijas a una secuencia de fases declarada por
 * el patron, asi que un patron nuevo en el nucleo no necesita codigo nuevo
 * aqui: la fase "sostener" simplemente mantiene la escala y espera.
 *
 * Equivalencias con el driver CSS del sitio (respira.css):
 *  - Respiracion: escala exhalado-inhalado con la misma bezier, fase por fase
 *    (en CSS la curva aplica por tramo de keyframe; aqui, por timing de cada
 *    fase). Senal dominante.
 *  - Rotores: giro lineal infinito por capa, con duracion, sentido y fase
 *    sorteados por el nucleo (fase = animation-delay negativo del CSS).
 *  - Tijera de alas: base y espejo oscilan +-tdeg en sentidos opuestos,
 *    ease-in-out alternate.
 *  - Pulso radial: escala pulsoMin-pulsoMax, ease-in-out alternate.
 *  - Cues: la palabra de la fase en curso; el crossfade dura el 5% del ciclo y
 *    TERMINA en el cambio de fase, igual que la ventana 45-50% del CSS (se
 *    agenda antes del borde de cada fase).
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

const EASE_RESPIRO = Easing.bezier(...RESPIRA_RITMO.bezier);
// Equivalente exacto del keyword ease-in-out de CSS.
const EASE_INOUT = Easing.bezier(0.42, 0, 0.58, 1);

// Claves de fase que existen en el nucleo. La app monta una palabra por clave
// (aunque el patron activo no la use) para que el crossfade sea siempre el
// mismo codigo.
const CLAVES_CUE = ['inhalar', 'sostener', 'exhalar'];

/**
 * Traduce las fases del patron a tramos de animacion. El valor animado va de 0
 * (exhalado) a 1 (inhalado); inhalar sube, exhalar baja y sostener se queda
 * donde estaba, que es lo que hace que la figura se detenga durante la apnea.
 */
function crearSecuencia(patron) {
  let actual = 0;
  const tramos = patron.fases.map((f) => {
    const desde = actual;
    const hasta = f.clave === 'inhalar' ? 1 : f.clave === 'exhalar' ? 0 : actual;
    actual = hasta;
    return { clave: f.clave, cue: f.cue, durMs: f.s * 1000, desde, hasta };
  });
  return {
    id: patron.id,
    tramos,
    fadeMs: Math.round(patron.cicloS * 1000 * 0.05),
    i: 0,
    tau: 0,
    tauInicio: 0,
    t0: 0,
    timer: null,
    val: new Animated.Value(tramos[0].desde),
  };
}

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
  const [patronId, setPatronId] = useState(RESPIRA_RITMO.id);
  const patron = RESPIRA_PATRONES.find((p) => p.id === patronId) || RESPIRA_RITMO;
  const [textoReducido, setTextoReducido] = useState(patron.fases[0].cue);

  // Canales de animacion ajenos al patron (giros, tijera, pulso): siguen igual
  // al alternar de ritmo, asi la figura no da ningun salto. tau = fraccion de
  // tiempo consumida del tramo en curso; val = Animated.Value 0..1 cuyo easing
  // vive en el timing.
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
      // Una opacidad por clave de fase; el patron activo usa las que declara.
      opCue: CLAVES_CUE.reduce((acc, clave) => {
        acc[clave] = new Animated.Value(0);
        return acc;
      }, {}),
      timersCue: [],
    };
  }
  const { canales, opCue } = motor.current;

  // Secuencia de respiracion del patron activo. Si el patron cambia, se
  // rearma entera (el ejercicio queda en pausa al alternar, ver cambiarPatron).
  const seq = useRef(null);
  if (seq.current === null || seq.current.id !== patron.id) {
    seq.current = crearSecuencia(patron);
  }

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

  const cruzarCues = (claveDestino, durMs) => {
    Animated.parallel(
      CLAVES_CUE.map((clave) =>
        Animated.timing(opCue[clave], {
          toValue: clave === claveDestino ? 1 : 0,
          duration: durMs,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ).start();
  };

  // El crossfade dura el 5% del ciclo y termina justo en el cambio de fase,
  // como la ventana 45-50% del CSS: se agenda restante - fadeMs despues de
  // arrancar cada fase.
  const programarCue = (s, claveDestino, restanteMs) => {
    const dur = Math.min(s.fadeMs, restanteMs);
    const t = setTimeout(() => {
      cruzarCues(claveDestino, dur);
    }, Math.max(0, restanteMs - dur));
    motor.current.timersCue.push(t);
  };

  // Motor de la respiracion: recorre las fases del patron en circulo. La fase
  // de sostenido no anima nada (desde === hasta), solo espera; por eso el
  // avance se agenda con un temporizador en vez de con el fin de una curva.
  const pasoSecuencia = (s) => {
    const tramo = s.tramos[s.i];
    const siguiente = s.tramos[(s.i + 1) % s.tramos.length];
    const restante = Math.max(16, (1 - s.tau) * tramo.durMs);
    programarCue(s, siguiente.clave, restante);
    s.tauInicio = s.tau;
    s.t0 = Date.now();

    const avanzar = () => {
      s.i = (s.i + 1) % s.tramos.length;
      s.tau = 0;
      pasoSecuencia(s);
    };

    if (tramo.desde === tramo.hasta) {
      s.val.setValue(tramo.hasta);
      s.timer = setTimeout(avanzar, restante);
      return;
    }
    Animated.timing(s.val, {
      toValue: tramo.hasta,
      duration: restante,
      easing: EASE_RESPIRO,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) avanzar();
    });
  };

  // Tijera y pulso: vaiven continuo, sin cues y sin relacion con el patron.
  const pasoAlternante = (c) => {
    const objetivo = c.adelante ? 1 : 0;
    const restante = Math.max(16, (1 - c.tau) * c.durMs);
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
      pasoAlternante(c);
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

  const arrancar = (s) => {
    CLAVES_CUE.forEach((clave) => {
      opCue[clave].setValue(clave === s.tramos[s.i].clave ? 1 : 0);
    });
    pasoSecuencia(s);
    pasoLineal(canales.rotA);
    pasoLineal(canales.rotB);
    pasoLineal(canales.rotC);
    pasoAlternante(canales.tij);
    pasoAlternante(canales.pul);
  };

  const congelar = (s) => {
    limpiarTimers();
    // La respiracion guarda su avance por reloj: es exacto tambien en la fase
    // de sostenido, donde el valor animado no se mueve y no habria nada que
    // invertir.
    if (s.timer) {
      clearTimeout(s.timer);
      s.timer = null;
    }
    s.val.stopAnimation();
    const avance = (Date.now() - s.t0) / s.tramos[s.i].durMs;
    s.tau = Math.min(Math.max(s.tauInicio + avance, 0), 1);

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
    CLAVES_CUE.forEach((clave) => {
      opCue[clave].stopAnimation();
      opCue[clave].setValue(0);
    });
  };

  useEffect(() => {
    if (reduce || !corriendo) return undefined;
    // La secuencia se captura al arrancar: si el patron cambia, la cadena
    // recursiva que quede viva opera sobre el objeto viejo y muere al pararlo.
    const s = seq.current;
    arrancar(s);
    return () => congelar(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, reduce, patronId]);

  useEffect(() => {
    // Reduce-motion: figura fija; el ritmo lo marcan solo las palabras, una
    // por fase y durante lo que dura esa fase.
    if (!reduce || !corriendo) return undefined;
    let i = 0;
    let timer = null;
    setTextoReducido(patron.fases[0].cue);
    const paso = () => {
      timer = setTimeout(() => {
        i = (i + 1) % patron.fases.length;
        setTextoReducido(patron.fases[i].cue);
        paso();
      }, patron.fases[i].s * 1000);
    };
    paso();
    return () => clearTimeout(timer);
  }, [reduce, corriendo, patron]);

  // Alternar de patron deja el ejercicio en pausa a proposito: el conteo
  // cambia y conviene leer la instruccion nueva antes de seguir.
  const cambiarPatron = () => {
    setCorriendo(false);
    setPatronId(patronSiguiente(patronId).id);
  };

  // ---- Transformaciones (mapeo lineal; el easing ya viajo en el timing) ----

  const escala = seq.current.val.interpolate({
    inputRange: [0, 1],
    outputRange: [patron.escalaExhalado, patron.escalaInhalado],
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
    outputRange: [patron.pulsoMin, patron.pulsoMax],
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
              ? { transform: [{ scale: patron.escalaReposo }] }
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

        {/* Palabras guia centradas sobre la figura (una por fase del patron) */}
        <View style={[capa, styles.centro]} pointerEvents="none">
          {reduce ? (
            corriendo ? (
              <Text style={styles.cue}>{textoReducido}</Text>
            ) : (
              <Text style={styles.cue}>Comienza cuando quieras</Text>
            )
          ) : corriendo ? (
            patron.fases.map((f) => (
              <Animated.Text
                key={f.clave}
                style={[styles.cue, styles.cueAbs, { opacity: opCue[f.clave] }]}
              >
                {f.cue}
              </Animated.Text>
            ))
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
          {corriendo ? patron.estadoVivo : `Ejercicio en pausa. Ritmo actual: ${patron.nombre}.`}
        </Text>
        <Text style={styles.instruccion}>{patron.instruccion}</Text>
        <Text style={styles.ayuda}>{patron.duracion}</Text>
        {reduce ? <Text style={styles.notaReduce}>{patron.notaReducida}</Text> : null}

        {/* Cambio de ritmo: el mismo control lleva al otro patron y de vuelta.
            Va como enlace y no como boton lleno para que no compita con
            Iniciar, que es la accion principal. */}
        <Pressable onPress={cambiarPatron} accessibilityRole="button" style={styles.cambio}>
          <Text style={styles.cambioTexto}>{patron.ctaCambio}</Text>
        </Pressable>
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
  instruccion: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.inkSoft,
    marginTop: 16,
    maxWidth: 340,
    textAlign: 'center',
  },
  ayuda: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.inkSoft,
    marginTop: 10,
    maxWidth: 340,
    textAlign: 'center',
  },
  cambio: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cambioTexto: {
    fontFamily: FONTS.bodyMed,
    fontSize: 15,
    color: COLORS.sage,
    textAlign: 'center',
    textDecorationLine: 'underline',
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
