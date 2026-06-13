import { useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { PRESTADOR } from '@contenido/contacto';
import { COLORS, FONTS } from '../theme/tokens';

const ICONO = require('../../assets/icon.png');

/**
 * Pantalla de carga de marca. El splash nativo (icono sobre crema) se mantiene
 * hasta que esta capa esta pintada; en ese momento ocultamos el nativo y la
 * transicion es invisible porque la capa muestra el MISMO icono al mismo
 * tamano. Luego el icono cobra vida (un anillo se expande, el nombre asciende),
 * sostiene un instante y todo se desvanece para revelar la app.
 *
 * El anillo que respira es un guino a la herramienta Respira conmigo.
 *
 * Cero dependencias nativas nuevas: solo Animated del nucleo de React Native.
 * Si el dispositivo pide menos movimiento, se omite la animacion y la capa solo
 * sostiene un instante antes de salir.
 */
export default function SplashAnimado({ onDone }) {
  const opCapa = useRef(new Animated.Value(1)).current;
  const escalaIcono = useRef(new Animated.Value(1)).current;
  const opAnillo = useRef(new Animated.Value(0)).current;
  const escalaAnillo = useRef(new Animated.Value(0.7)).current;
  const opNombre = useRef(new Animated.Value(0)).current;
  const tyNombre = useRef(new Animated.Value(8)).current;
  const [arrancado, setArrancado] = useState(false);

  const terminar = () => {
    if (onDone) onDone();
  };

  const alPintar = async () => {
    if (arrancado) return;
    setArrancado(true);
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // El splash ya estaba oculto; seguimos igual.
    }
    let reduce = false;
    try {
      reduce = await AccessibilityInfo.isReduceMotionEnabled();
    } catch (e) {
      reduce = false;
    }

    if (reduce) {
      Animated.sequence([
        Animated.delay(550),
        Animated.timing(opCapa, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start(terminar);
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opAnillo, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(escalaAnillo, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(260),
          Animated.parallel([
            Animated.timing(opNombre, {
              toValue: 1,
              duration: 520,
              useNativeDriver: true,
            }),
            Animated.timing(tyNombre, {
              toValue: 0,
              duration: 520,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.delay(560),
      Animated.parallel([
        Animated.timing(opCapa, {
          toValue: 0,
          duration: 460,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(escalaIcono, {
          toValue: 1.05,
          duration: 460,
          useNativeDriver: true,
        }),
      ]),
    ]).start(terminar);
  };

  return (
    <Animated.View style={[styles.capa, { opacity: opCapa }]} onLayout={alPintar}>
      <View style={styles.centro}>
        <Animated.View
          style={[
            styles.anillo,
            { opacity: opAnillo, transform: [{ scale: escalaAnillo }] },
          ]}
        />
        <Animated.Image
          source={ICONO}
          resizeMode="contain"
          style={[styles.icono, { transform: [{ scale: escalaIcono }] }]}
        />
      </View>
      <Animated.Text
        style={[styles.nombre, { opacity: opNombre, transform: [{ translateY: tyNombre }] }]}
      >
        {PRESTADOR.nombre}
      </Animated.Text>
      <Animated.Text style={[styles.titulo, { opacity: opNombre }]}>
        {PRESTADOR.titulo}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 50,
  },
  centro: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1.5,
    borderColor: 'rgba(63,91,74,0.32)',
  },
  icono: {
    width: 160,
    height: 160,
  },
  nombre: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.ink,
  },
  titulo: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 14,
    letterSpacing: 0.3,
    color: COLORS.sage,
  },
});
