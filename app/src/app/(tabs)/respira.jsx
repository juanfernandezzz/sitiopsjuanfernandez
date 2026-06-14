import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { RESPIRA_TEXTO } from '@contenido/respiraNucleo';
import { COLORS, FONTS } from '../../theme/tokens';
import EncabezadoApp from '../../components/EncabezadoApp';
import Aparece from '../../components/Aparece';
import RespiraVisor from '../../components/RespiraVisor';
import Boton from '../../components/Boton';

/**
 * Respira conmigo (app): version nativa del ejercicio de respiracion pausada
 * del sitio. El ritmo y el encuadre son los mismos; la figura y la interaccion
 * son nativas (ver RespiraVisor). El texto (titulo, intro, seguridad y puente)
 * viene del nucleo compartido RESPIRA_TEXTO, asi el sitio y la app dicen lo
 * mismo en el mismo deploy/OTA.
 *
 * Encuadre no negociable: herramienta de apoyo para la relajacion, sin promesas
 * de resultado. No es un tratamiento ni reemplaza un proceso de psicoterapia.
 */
export default function Respira() {
  const router = useRouter();

  return (
    <View style={styles.pantalla}>
      <EncabezadoApp />
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Aparece>
          <Text style={styles.eyebrow}>{RESPIRA_TEXTO.eyebrow}</Text>
          <Text style={styles.titulo}>{RESPIRA_TEXTO.titulo}</Text>
          <Text style={styles.intro}>{RESPIRA_TEXTO.intro}</Text>
        </Aparece>

        <Aparece delay={120} style={styles.visor}>
          <RespiraVisor />
        </Aparece>

        <Aparece delay={200}>
          <Text style={styles.seguridad}>{RESPIRA_TEXTO.seguridad}</Text>
        </Aparece>

        <Aparece delay={260} style={styles.puente}>
          <Text style={styles.puenteTexto}>{RESPIRA_TEXTO.puenteTexto}</Text>
          <Boton onPress={() => router.push('/agendar')}>{RESPIRA_TEXTO.puenteCta}</Boton>
        </Aparece>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.cream },
  contenido: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 48 },
  eyebrow: {
    fontFamily: FONTS.bodyMed,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.sage,
    marginTop: 6,
    marginBottom: 8,
  },
  titulo: {
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 40,
    color: COLORS.ink,
    marginBottom: 12,
  },
  intro: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.inkSoft,
  },
  visor: { marginTop: 30 },
  seguridad: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkSoft,
    marginTop: 30,
  },
  puente: {
    marginTop: 30,
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  puenteTexto: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.inkSoft,
    marginBottom: 16,
  },
});
