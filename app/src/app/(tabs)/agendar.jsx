import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CAL_EVENTS } from '@contenido/cal';
import { CONTACTO } from '@contenido/contacto';
import { SESIONES } from '@contenido/sesiones';
import { PROCESO_ONLINE } from '@contenido/proceso';
import { COLORS, FONTS } from '../../theme/tokens';
import TarjetaSesion from '../../components/TarjetaSesion';
import EncabezadoApp from '../../components/EncabezadoApp';
import Boton from '../../components/Boton';
import Aparece from '../../components/Aparece';
import { abrirAgenda, abrirUrl } from '../../lib/abrir';

// Las claves de confianza vienen del nucleo compartido; aqui solo se mapean al
// set de iconos de la app (Feather). El texto se sincroniza, el icono no.
const ICONO_CONFIANZA = { conexion: 'wifi', privacidad: 'user', cifrado: 'lock' };

export default function Agendar() {
  return (
    <View style={styles.pantalla}>
      <EncabezadoApp />
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
      <Aparece>
        <Text style={styles.titulo}>Agendar</Text>
        <Text style={styles.bajada}>Elige el tipo de sesión. Abro la agenda y reservas en el mismo flujo.</Text>
      </Aparece>

      {SESIONES.map((s, i) => (
        <Aparece key={s.key} delay={80 + i * 70}>
          <TarjetaSesion
            titulo={s.titulo}
            precio={s.precio}
            detalle={s.detalle}
            destacada={s.destacada}
            cta={s.cta}
            onPress={() => abrirAgenda(CAL_EVENTS[s.key])}
          />
        </Aparece>
      ))}

      <Aparece delay={120}>
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Cómo es el proceso</Text>
          {PROCESO_ONLINE.pasos.map((p) => (
            <View key={p.num} style={styles.paso}>
              <Text style={styles.pasoNum}>{p.num}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pasoTitulo}>{p.titulo}</Text>
                <Text style={styles.pasoTexto}>{p.texto}</Text>
                {p.nota ? <Text style={styles.pasoNota}>{p.nota}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </Aparece>

      <Aparece delay={120}>
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Una sesión protegida</Text>
          <View style={styles.trio}>
            {PROCESO_ONLINE.confianza.map((c) => (
              <View key={c.clave} style={styles.trioItem}>
                <Feather name={ICONO_CONFIANZA[c.clave]} size={22} color={COLORS.sage} />
                <Text style={styles.trioTitulo}>{c.titulo}</Text>
                <Text style={styles.trioTexto}>{c.texto}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.trioPie}>
            La videollamada usa Doxy.me, plataforma certificada por Fonasa, con cifrado en tránsito y
            sin descargas.
          </Text>
        </View>
      </Aparece>

      <Aparece delay={120}>
        <Text style={styles.dudas}>¿Tienes dudas antes de agendar?</Text>
        <Boton variant="secondary" onPress={() => abrirUrl(CONTACTO.whatsappUrl)}>
          Conversar por WhatsApp
        </Boton>
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
  bloque: {
    backgroundColor: COLORS.offwhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  bloqueTitulo: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, marginBottom: 14 },
  paso: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  pasoNum: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.onSage,
    backgroundColor: COLORS.sage,
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  pasoTitulo: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.ink, marginBottom: 3 },
  pasoTexto: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, lineHeight: 22 },
  pasoNota: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    color: COLORS.inkSoft,
    lineHeight: 20,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(63,91,74,0.3)',
    paddingLeft: 10,
  },
  trio: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  trioItem: { flex: 1, alignItems: 'center' },
  trioTitulo: {
    fontFamily: FONTS.bodyMed,
    fontSize: 12.5,
    color: COLORS.ink,
    marginTop: 8,
    textAlign: 'center',
  },
  trioTexto: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    color: COLORS.inkSoft,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 17,
  },
  trioPie: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkSoft,
    lineHeight: 21,
    marginTop: 14,
  },
  dudas: { fontFamily: FONTS.bodyMed, fontSize: 15, color: COLORS.ink, textAlign: 'center', marginTop: 8, marginBottom: 12 },
});
