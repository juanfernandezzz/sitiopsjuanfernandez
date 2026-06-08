import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRESTADOR, CONTACTO } from '@contenido/contacto';
import { PRECIOS } from '@contenido/precios';
import { COLORS, FONTS } from '../../theme/tokens';
import Marca from '../../components/Marca';
import Boton from '../../components/Boton';
import FilaConfianza from '../../components/FilaConfianza';
import { abrirUrl } from '../../lib/abrir';

export default function Inicio() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <Marca />

      <Text style={styles.h1}>Acompañamiento sin prejuicios, desde la comodidad de tu hogar.</Text>

      <Text style={styles.sub}>
        Psicoterapia online con enfoque integrativo: terapia cognitivo conductual y narrativa.
        Sesiones de 45 minutos por videollamada.
      </Text>

      <View style={styles.ctaBloque}>
        <Boton onPress={() => router.push('/agendar')}>Agendar videoconsulta</Boton>
        <Text style={styles.microcopy}>
          Primera sesión con bono Fonasa: copago {PRECIOS.fonasaCopago.display}.
        </Text>
        <Boton variant="secondary" onPress={() => abrirUrl(CONTACTO.whatsappUrl)} style={{ marginTop: 10 }}>
          Conversar por WhatsApp
        </Boton>
      </View>

      <View style={styles.tarjetaConfianza}>
        <Text style={styles.tituloConfianza}>Por qué puedes confiar</Text>
        <FilaConfianza texto={'Psicólogo clínico titulado, ' + PRESTADOR.universidad + '.'} icono="award" />
        <FilaConfianza texto={'Registro Nacional de Prestadores RNPI ' + PRESTADOR.rnpi + '.'} icono="shield" />
        <FilaConfianza texto="Atención por plataforma certificada por Fonasa." icono="check-circle" />
        <FilaConfianza texto="Confidencialidad y cifrado en tránsito en cada sesión." icono="lock" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 22, paddingBottom: 40 },
  h1: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 38,
    color: COLORS.ink,
    marginTop: 28,
  },
  sub: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.inkSoft,
    marginTop: 14,
  },
  ctaBloque: { marginTop: 26 },
  microcopy: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkFaint,
    textAlign: 'center',
    marginTop: 12,
  },
  tarjetaConfianza: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    marginTop: 30,
  },
  tituloConfianza: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: 14,
  },
});
