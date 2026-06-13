import { ScrollView, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../theme/tokens';
import Aparece from '../../components/Aparece';
import RespiraVisor from '../../components/RespiraVisor';
import Boton from '../../components/Boton';

/**
 * Respira conmigo (app, C25): version nativa del ejercicio de respiracion
 * pausada del sitio. El ritmo y el encuadre son los mismos; la figura y la
 * interaccion son nativas (ver RespiraVisor).
 *
 * Encuadre no negociable: herramienta de apoyo para la relajacion, sin promesas
 * de resultado. No es un tratamiento ni reemplaza un proceso de psicoterapia.
 */
export default function Respira() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <Aparece>
        <Text style={styles.eyebrow}>Una pausa para ti</Text>
        <Text style={styles.titulo}>Respira conmigo</Text>
        <Text style={styles.intro}>
          Un ejercicio visual para bajar el ritmo: la figura se expande cuando inhalas y se recoge
          cuando exhalas, a un ritmo lento, cercano a 6 respiraciones por minuto. La figura cambia
          de forma lentamente todo el tiempo: nunca dibuja dos veces la misma. Respira de forma
          suave y silenciosa, sin forzar.
        </Text>
      </Aparece>

      <Aparece delay={120} style={styles.visor}>
        <RespiraVisor />
      </Aparece>

      <Aparece delay={200}>
        <Text style={styles.seguridad}>
          Esta es una herramienta de apoyo para la relajación: no es un tratamiento ni reemplaza un
          proceso de psicoterapia. Si sientes mareo o incomodidad, detente y vuelve a tu ritmo
          natural.
        </Text>
      </Aparece>

      <Aparece delay={260} style={styles.puente}>
        <Text style={styles.puenteTexto}>
          ¿Sientes que necesitas más que una pausa? Podemos trabajarlo juntos en sesión.
        </Text>
        <Boton onPress={() => router.push('/agendar')}>Agendar una sesión</Boton>
      </Aparece>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 22, paddingBottom: 48 },
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
