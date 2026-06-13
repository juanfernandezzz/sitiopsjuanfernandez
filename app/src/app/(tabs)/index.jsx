import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CONTACTO } from '@contenido/contacto';
import { HERO } from '@contenido/hero';
import { MOTIVOS } from '@contenido/motivos';
import { CREDENCIALES } from '@contenido/credenciales';
import { COLORS, FONTS } from '../../theme/tokens';
import Marca from '../../components/Marca';
import Boton from '../../components/Boton';
import FilaConfianza from '../../components/FilaConfianza';
import Aparece from '../../components/Aparece';
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
      <Aparece>
        <Marca />
      </Aparece>

      <Aparece delay={90}>
        <Text style={styles.h1}>{`${HERO.lineaFija} ${HERO.rotativas[0]}`}</Text>
        <Text style={styles.sub}>{HERO.sub}</Text>
      </Aparece>

      <Aparece delay={170}>
        <View style={styles.ctaBloque}>
          <Boton onPress={() => router.push('/agendar')}>{HERO.ctaPrimario}</Boton>
          <Text style={styles.microcopy}>{HERO.microcopia}</Text>
          <Boton
            variant="secondary"
            onPress={() =>
              abrirUrl(`${CONTACTO.whatsappUrl}?text=${encodeURIComponent(HERO.mensajeWhatsApp)}`)
            }
            style={{ marginTop: 10 }}
          >
            {HERO.ctaSecundario}
          </Boton>
        </View>
      </Aparece>

      <Aparece delay={240}>
        <View style={styles.motivos}>
          <Text style={styles.motivosEyebrow}>Te acompaño en procesos como estos</Text>
          <View style={styles.chips}>
            {MOTIVOS.map((m) => (
              <View key={m} style={styles.chip}>
                <Text style={styles.chipTexto}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      </Aparece>

      <Aparece delay={300}>
        <View style={styles.tarjetaConfianza}>
          <Text style={styles.tituloConfianza}>Por qué puedes confiar</Text>
          {CREDENCIALES.map((c) => (
            <FilaConfianza key={c} texto={c} icono="check" />
          ))}
          <FilaConfianza texto="Atención por plataforma certificada por Fonasa." icono="shield" />
          <FilaConfianza texto="Confidencialidad y cifrado en tránsito en cada sesión." icono="lock" />
        </View>
      </Aparece>

      <Aparece delay={360}>
        <Pressable
          onPress={() => router.push('/respira')}
          style={({ pressed }) => [styles.respira, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <View style={styles.respiraIcono}>
            <Feather name="wind" size={20} color={COLORS.sage} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.respiraTitulo}>Respira conmigo</Text>
            <Text style={styles.respiraTexto}>
              Una pausa guiada para bajar el ritmo cuando lo necesites.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.inkFaint} />
        </Pressable>
      </Aparece>
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
  motivos: { marginTop: 28 },
  motivosEyebrow: {
    fontFamily: FONTS.bodyMed,
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.sage,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(63,91,74,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  chipTexto: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.ink },
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
  respira: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 18,
    marginTop: 14,
  },
  respiraIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,181,160,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respiraTitulo: { fontFamily: FONTS.display, fontSize: 17, color: COLORS.ink },
  respiraTexto: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkSoft,
    marginTop: 3,
    lineHeight: 20,
  },
});
