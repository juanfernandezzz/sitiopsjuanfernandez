import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PRESTADOR } from '@contenido/contacto';
import { CAL_EVENTS } from '@contenido/cal';
import { SESIONES } from '@contenido/sesiones';
import { COLORS, FONTS } from '../theme/tokens';
import { abrirAgenda } from '../lib/abrir';

/**
 * Encabezado persistente de la app (C26): barra superior sage con la marca en
 * Garamond (igual que el wordmark del sitio) y un boton "Agendar" en
 * terracota-deep (#A4583B, el mismo tono AA del CTA primario del sitio). El
 * boton despliega una hoja inferior con las cuatro sesiones; cada una abre la
 * agenda de Cal.com en el navegador dentro de la app.
 *
 * Coherencia: las sesiones, claves y enlaces vienen del mismo nucleo compartido
 * que el desplegable "Agendar" del header web (SESIONES + CAL_EVENTS). La
 * interfaz es nativa; los datos son los mismos.
 *
 * Cero dependencias nativas nuevas: la hoja usa Modal y Animated del nucleo de
 * React Native, asi que el cambio viaja por OTA sin recompilar.
 */
export default function EncabezadoApp() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <View style={[styles.barra, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
          hitSlop={6}
        >
          <Text style={styles.marca}>{PRESTADOR.nombre}</Text>
          <Text style={styles.subtitulo}>{PRESTADOR.titulo}</Text>
        </Pressable>

        <Pressable
          onPress={() => setAbierta(true)}
          accessibilityRole="button"
          accessibilityLabel="Agendar una sesión"
          style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.botonTexto}>Agendar</Text>
          <Feather name="chevron-down" size={15} color={COLORS.onSage} />
        </Pressable>
      </View>

      <HojaAgendar abierta={abierta} alCerrar={() => setAbierta(false)} />
    </>
  );
}

function HojaAgendar({ abierta, alCerrar }) {
  const insets = useSafeAreaInsets();
  const [montada, setMontada] = useState(abierta);
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (abierta) {
      setMontada(true);
      Animated.timing(prog, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (montada) {
      Animated.timing(prog, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMontada(false));
    }
  }, [abierta]);

  const elegir = (key) => {
    alCerrar();
    abrirAgenda(CAL_EVENTS[key]);
  };

  const translateY = prog.interpolate({ inputRange: [0, 1], outputRange: [560, 0] });

  if (!montada) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={alCerrar} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: prog }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={alCerrar} accessibilityLabel="Cerrar" />
      </Animated.View>

      <View style={styles.hojaContenedor} pointerEvents="box-none">
        <Animated.View
          style={[styles.hoja, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}
        >
          <View style={styles.asa} />
          <Text style={styles.hojaTitulo}>¿Qué sesión quieres agendar?</Text>
          <Text style={styles.hojaBajada}>
            Elige una opción y abro la agenda para que reserves la hora que te acomode.
          </Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {SESIONES.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => elegir(s.key)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.opcion,
                  s.destacada && styles.opcionDestacada,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcionTitulo}>{s.titulo}</Text>
                  <Text style={styles.opcionPrecio}>{s.precio}</Text>
                  <Text style={styles.opcionDetalle}>{s.detalleApp}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.inkFaint} />
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.sage,
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  marca: {
    fontFamily: FONTS.marca,
    fontSize: 21,
    color: COLORS.onSage,
    letterSpacing: 0.3,
  },
  subtitulo: {
    fontFamily: FONTS.body,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(246,241,232,0.72)',
    marginTop: 2,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.terracotaDeep,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  botonTexto: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.onSage,
    letterSpacing: 0.2,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,59,76,0.45)',
  },
  hojaContenedor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  hoja: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  asa: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(42,59,76,0.18)',
    marginBottom: 16,
  },
  hojaTitulo: {
    fontFamily: FONTS.display,
    fontSize: 21,
    color: COLORS.ink,
    marginBottom: 6,
  },
  hojaBajada: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.inkSoft,
    marginBottom: 16,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.offwhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  opcionDestacada: { borderColor: COLORS.terracota, borderWidth: 1.5 },
  opcionTitulo: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.ink },
  opcionPrecio: { fontFamily: FONTS.bodyMed, fontSize: 14, color: COLORS.sage, marginTop: 2 },
  opcionDetalle: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    color: COLORS.inkSoft,
    lineHeight: 19,
    marginTop: 4,
  },
});
