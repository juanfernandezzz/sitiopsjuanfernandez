import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, AccessibilityInfo } from 'react-native';

/**
 * Aparece: revela su contenido con un fundido y un desplazamiento corto hacia
 * arriba, con retardo opcional para escalonar bloques (mismo patron que la
 * entrada anim-rise del sitio). Todo corre en el hilo de UI (useNativeDriver)
 * para no competir con JavaScript.
 *
 * Accesibilidad: si el dispositivo pide menos movimiento, el contenido aparece
 * de inmediato, sin animacion.
 */
export default function Aparece({ children, delay = 0, distancia = 10, style }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(distancia)).current;
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (vivo) setReduce(v);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (reduce) {
      op.setValue(1);
      ty.setValue(0);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 480,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduce, delay, op, ty]);

  return (
    <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>
      {children}
    </Animated.View>
  );
}
