import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAL_EVENTS } from '@contenido/cal';
import { CONTACTO } from '@contenido/contacto';
import { PRECIOS } from '@contenido/precios';
import { COLORS, FONTS } from '../../theme/tokens';
import TarjetaSesion from '../../components/TarjetaSesion';
import Boton from '../../components/Boton';
import { abrirAgenda, abrirUrl } from '../../lib/abrir';

const SESIONES = [
  {
    key: CAL_EVENTS.primeraSesionFonasa,
    titulo: 'Primera sesión con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalle: 'Si es tu primera vez. Conversamos y entendemos juntos qué te trae.',
    destacada: true,
    cta: 'Agendar primera sesión',
  },
  {
    key: CAL_EVENTS.controlAvanceFonasa,
    titulo: 'Sesión de avance con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalle: 'Si ya iniciaste tratamiento conmigo.',
    cta: 'Agendar sesión de avance',
  },
  {
    key: CAL_EVENTS.parejaFonasa,
    titulo: 'Sesión de pareja con bono Fonasa',
    precio: PRECIOS.fonasaCopago.display,
    detalle: 'Con ambos miembros presentes.',
    cta: 'Agendar sesión de pareja',
  },
  {
    key: CAL_EVENTS.particular15000,
    titulo: 'Sesión particular',
    precio: PRECIOS.particular.display,
    detalle: 'Sin previsión requerida. Comprobante para reembolso de Isapre cuando aplique.',
    cta: 'Agendar sesión particular',
  },
];

const PASOS = [
  'Eliges el tipo de sesión y la hora que te acomode.',
  'Recibes confirmación inmediata y recordatorios por correo.',
  'Te conectas por videollamada a la plataforma certificada por Fonasa.',
];

export default function Agendar() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Agendar</Text>
      <Text style={styles.bajada}>Elige el tipo de sesión. Abro la agenda y reservas en el mismo flujo.</Text>

      {SESIONES.map((s) => (
        <TarjetaSesion
          key={s.key}
          titulo={s.titulo}
          precio={s.precio}
          detalle={s.detalle}
          destacada={s.destacada}
          cta={s.cta}
          onPress={() => abrirAgenda(s.key)}
        />
      ))}

      <View style={styles.bloque}>
        <Text style={styles.bloqueTitulo}>Cómo es el proceso</Text>
        {PASOS.map((p, i) => (
          <View key={i} style={styles.paso}>
            <Text style={styles.pasoNum}>{i + 1}</Text>
            <Text style={styles.pasoTexto}>{p}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bloque}>
        <Text style={styles.bloqueTitulo}>Confidencialidad</Text>
        <Text style={styles.parrafo}>
          Tus datos están protegidos. La videollamada usa una plataforma certificada por Fonasa,
          con cifrado en tránsito.
        </Text>
      </View>

      <Text style={styles.dudas}>¿Tienes dudas antes de agendar?</Text>
      <Boton variant="secondary" onPress={() => abrirUrl(CONTACTO.whatsappUrl)}>
        Conversar por WhatsApp
      </Boton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 22, paddingBottom: 44 },
  titulo: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.ink, marginTop: 18, marginBottom: 6 },
  bajada: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, marginBottom: 22, lineHeight: 22 },
  bloque: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  bloqueTitulo: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, marginBottom: 12 },
  paso: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  pasoNum: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.onSage,
    backgroundColor: COLORS.sage,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  pasoTexto: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, flex: 1, lineHeight: 22 },
  parrafo: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, lineHeight: 22 },
  dudas: { fontFamily: FONTS.bodyMed, fontSize: 15, color: COLORS.ink, textAlign: 'center', marginTop: 8, marginBottom: 12 },
});
