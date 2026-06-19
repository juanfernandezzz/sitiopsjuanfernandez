import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FAQ_ITEMS } from '@contenido/faqData';
import { SOBRE_MI } from '@contenido/sobreMi';
import { COLORS, FONTS } from '../../theme/tokens';
import EncabezadoApp from '../../components/EncabezadoApp';
import Aparece from '../../components/Aparece';
import { abrirUrl } from '../../lib/abrir';

/**
 * Item de Preguntas frecuentes con apertura animada. La respuesta entra con un
 * fundido corto y el icono gira: una sola cruz que pasa de mas (cerrado) a x
 * (abierto), girando 45 grados. El cierre es instantaneo y la respuesta se
 * desmonta de inmediato, asi no hay que medir alturas (lo que se vuelve fragil
 * con la nueva arquitectura de React Native). Todo corre en el hilo de UI.
 *
 * Si el item trae un enlace interno (href que empieza con /), lo abrimos dentro
 * de la app. Antes este enlace solo existia en el sitio; ahora que la pantalla
 * Respira vive en la app, el enlace de esa respuesta navega a la pestana.
 */
function ItemFAQ({ q, a, link, reduce }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const rot = useRef(new Animated.Value(0)).current; // 0 cerrado, 1 abierto
  const opResp = useRef(new Animated.Value(0)).current;

  const alternar = () => {
    const siguiente = !abierto;
    if (siguiente) {
      setAbierto(true);
      if (reduce) {
        rot.setValue(1);
        opResp.setValue(1);
        return;
      }
      opResp.setValue(0);
      Animated.parallel([
        Animated.timing(rot, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opResp, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Cierre instantaneo del contenido; el icono gira de vuelta.
      setAbierto(false);
      opResp.setValue(0);
      if (reduce) {
        rot.setValue(0);
      } else {
        Animated.timing(rot, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const giro = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const tyResp = opResp.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  const abrirEnlace = () => {
    if (!link) return;
    if (link.href && link.href.startsWith('/')) {
      router.push(link.href);
    } else if (link.href) {
      abrirUrl(link.href);
    }
  };

  return (
    <Pressable
      onPress={alternar}
      style={({ pressed }) => [styles.faqItem, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityState={{ expanded: abierto }}
    >
      <View style={styles.faqFila}>
        <Text style={styles.faqQ}>{q}</Text>
        <Animated.View style={{ transform: [{ rotate: giro }] }}>
          <Feather name="plus" size={18} color={COLORS.sage} />
        </Animated.View>
      </View>
      {abierto ? (
        <Animated.View style={{ opacity: opResp, transform: [{ translateY: tyResp }] }}>
          <Text style={styles.faqA}>{a}</Text>
          {link ? (
            <Pressable
              onPress={abrirEnlace}
              style={({ pressed }) => [styles.faqEnlace, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              <Text style={styles.faqEnlaceTexto}>Abrir Respira conmigo</Text>
              <Feather name="arrow-right" size={15} color={COLORS.terracota} />
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

export default function Informacion() {
  const [reduce, setReduce] = useState(false);

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

  return (
    <View style={styles.pantalla}>
      <EncabezadoApp />
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
      <Aparece>
        <Text style={styles.titulo}>Información</Text>
      </Aparece>

      <Aparece delay={80}>
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>{SOBRE_MI.eyebrow}</Text>
          <Text style={styles.parrafo}>{SOBRE_MI.bio}</Text>
        </View>
      </Aparece>

      <Aparece delay={150}>
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>{SOBRE_MI.enfoque.titulo}</Text>
          <Text style={styles.parrafo}>{SOBRE_MI.enfoque.texto}</Text>
        </View>
      </Aparece>

      <Aparece delay={210}>
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>{SOBRE_MI.formato.titulo}</Text>
          <Text style={styles.parrafo}>{SOBRE_MI.formato.texto}</Text>
        </View>
      </Aparece>

      <Aparece delay={260}>
        <Text style={[styles.bloqueTitulo, { marginTop: 8, marginBottom: 6 }]}>Preguntas frecuentes</Text>
        {FAQ_ITEMS.map((item, i) => (
          <ItemFAQ key={i} q={item.q} a={item.a} link={item.link} reduce={reduce} />
        ))}
      </Aparece>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.cream },
  contenido: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 44 },
  titulo: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.ink, marginTop: 18, marginBottom: 18 },
  bloque: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    marginBottom: 14,
  },
  bloqueTitulo: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, marginBottom: 10 },
  parrafo: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, lineHeight: 23 },
  faqItem: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    marginBottom: 10,
  },
  faqFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.ink, flex: 1, lineHeight: 21 },
  faqA: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, lineHeight: 23, marginTop: 10 },
  faqEnlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  faqEnlaceTexto: {
    fontFamily: FONTS.bodyMed,
    fontSize: 15,
    color: COLORS.terracota,
  },
});
