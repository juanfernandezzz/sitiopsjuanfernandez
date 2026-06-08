import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { FAQ_ITEMS } from '@contenido/faqData';
import { COLORS, FONTS } from '../../theme/tokens';

function ItemFAQ({ q, a }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Pressable onPress={() => setAbierto((v) => !v)} style={styles.faqItem}>
      <View style={styles.faqFila}>
        <Text style={styles.faqQ}>{q}</Text>
        <Feather name={abierto ? 'minus' : 'plus'} size={18} color={COLORS.sage} />
      </View>
      {abierto ? <Text style={styles.faqA}>{a}</Text> : null}
    </Pressable>
  );
}

export default function Informacion() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Información</Text>

      <View style={styles.bloque}>
        <Text style={styles.bloqueTitulo}>El enfoque</Text>
        <Text style={styles.parrafo}>
          Trabajo con un enfoque integrativo que combina la terapia cognitivo conductual y la
          psicología narrativa, para adultos. Cada proceso parte de lo que te trae y se ajusta a ti.
        </Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.bloqueTitulo}>El formato</Text>
        <Text style={styles.parrafo}>
          Las sesiones duran 45 minutos y son por videollamada. La primera es para conocernos y
          entender juntos qué te trae. Si después no quieres continuar, no hay compromiso.
        </Text>
      </View>

      <Text style={[styles.bloqueTitulo, { marginTop: 8, marginBottom: 6 }]}>Preguntas frecuentes</Text>
      {FAQ_ITEMS.map((item, i) => (
        <ItemFAQ key={i} q={item.q} a={item.a} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 22, paddingBottom: 44 },
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
});
