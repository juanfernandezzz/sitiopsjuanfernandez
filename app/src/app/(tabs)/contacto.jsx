import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CONTACTO, REDES } from '@contenido/contacto';
import { COLORS, FONTS } from '../../theme/tokens';
import EncabezadoApp from '../../components/EncabezadoApp';
import Boton from '../../components/Boton';
import Aparece from '../../components/Aparece';
import { abrirUrl } from '../../lib/abrir';

function FilaEnlace({ icono, etiqueta, valor, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fila, pressed && { opacity: 0.6 }]}
    >
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
  return (
    <View style={styles.pantalla}>
      <EncabezadoApp />
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
      <Aparece>
        <Text style={styles.titulo}>Contacto</Text>
        <Text style={styles.bajada}>Para agendar, usa la sección Agendar. Para dudas, escríbeme por WhatsApp.</Text>
      </Aparece>

      <Aparece delay={90}>
        <Boton onPress={() => abrirUrl(CONTACTO.whatsappUrl)}>Escribir por WhatsApp</Boton>
      </Aparece>

      <Aparece delay={170}>
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
      </Aparece>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.cream },
  contenido: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 44 },
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
