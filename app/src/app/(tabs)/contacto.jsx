import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CONTACTO, REDES } from '@contenido/contacto';
import { COLORS, FONTS } from '../../theme/tokens';
import Boton from '../../components/Boton';
import { abrirUrl } from '../../lib/abrir';

function FilaEnlace({ icono, etiqueta, valor, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.fila}>
      <Feather name={icono} size={18} color={COLORS.sage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={COLORS.inkFaint} />
    </Pressable>
  );
}

export default function Contacto() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Contacto</Text>
      <Text style={styles.bajada}>Para agendar, usa la sección Agendar. Para dudas, escríbeme por WhatsApp.</Text>

      <Boton onPress={() => abrirUrl(CONTACTO.whatsappUrl)}>Escribir por WhatsApp</Boton>

      <View style={styles.tarjeta}>
        <FilaEnlace
          icono="mail"
          etiqueta="Correo"
          valor={CONTACTO.email}
          onPress={() => abrirUrl('mailto:' + CONTACTO.email)}
        />
        <View style={styles.sep} />
        <FilaEnlace
          icono="instagram"
          etiqueta="Instagram"
          valor={REDES.instagramHandle}
          onPress={() => abrirUrl(REDES.instagramUrl)}
        />
        <View style={styles.sep} />
        <FilaEnlace
          icono="facebook"
          etiqueta="Facebook"
          valor="Psicólogo Juan Fernández"
          onPress={() => abrirUrl(REDES.facebookUrl)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 22, paddingBottom: 44 },
  titulo: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.ink, marginTop: 18, marginBottom: 6 },
  bajada: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, marginBottom: 22, lineHeight: 22 },
  tarjeta: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 18,
    marginTop: 22,
  },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  etiqueta: { fontFamily: FONTS.bodyMed, fontSize: 13, color: COLORS.sage },
  valor: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.ink, marginTop: 2 },
  sep: { height: 1, backgroundColor: COLORS.line },
});
