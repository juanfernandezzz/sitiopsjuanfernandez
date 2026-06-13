import { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

/**
 * Boton con respuesta tactil: al presionar se contrae apenas con un resorte y
 * baja un poco de opacidad; al soltar vuelve con un rebote suave. El resorte
 * corre en el hilo de UI (useNativeDriver), asi la respuesta no depende de que
 * JavaScript este libre.
 *
 * La capa visual (fondo, borde, sombra) y la escala viven en una Animated.View
 * interna; el estilo que pasa el padre se aplica al Pressable para que los
 * margenes de maquetacion queden fuera de la animacion.
 */
export default function Boton({ children, onPress, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';
  const escala = useRef(new Animated.Value(1)).current;
  const opacidad = useRef(new Animated.Value(1)).current;

  const alPresionar = () => {
    Animated.parallel([
      Animated.spring(escala, {
        toValue: 0.97,
        speed: 40,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacidad, { toValue: 0.9, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const alSoltar = () => {
    Animated.parallel([
      Animated.spring(escala, {
        toValue: 1,
        speed: 22,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacidad, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={alPresionar}
      onPressOut={alSoltar}
      accessibilityRole="button"
      style={style}
    >
      <Animated.View
        style={[
          styles.base,
          isPrimary ? styles.primary : styles.secondary,
          { transform: [{ scale: escala }], opacity: opacidad },
        ]}
      >
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.sage,
    shadowColor: COLORS.ink,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.sage,
  },
  label: { fontFamily: FONTS.bodyBold, fontSize: 16, letterSpacing: 0.2 },
  labelPrimary: { color: COLORS.onSage },
  labelSecondary: { color: COLORS.sage },
});
