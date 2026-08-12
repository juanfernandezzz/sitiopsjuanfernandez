import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  CONFIRMACION,
  CONSENTIMIENTO,
  LLEGADA,
  tipoDeReserva,
  pasosFonasa,
  pasosParticular,
} from '@contenido/postReserva';
import { CONTACTO } from '@contenido/contacto';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';
import Boton from '../components/Boton';
import { abrirUrl } from '../lib/abrir';

/**
 * Pantalla de confirmacion de reserva (C27). Es el espejo nativo de la pagina
 * /cita-agendada del sitio: mismo contenido canonico (postReserva.js), misma
 * jerarquia (consentimiento primero, luego pago segun la sesion, luego la
 * llegada). A diferencia del sitio, aqui no hay etiqueta de Google: la app no
 * mide con Google Ads; llega a esta pantalla por el postMessage del WebView de
 * /reservar.
 *
 * El tipo de sesion llega como parametro `slug`. Si falta o no calza, se
 * muestran las dos vias de pago (degradacion segura).
 *
 * Los enlaces (consentimiento, Mi Fonasa, WebPay, Doxy, WhatsApp) se abren en el
 * navegador del sistema; en particular Doxy necesita el navegador real para la
 * camara y el microfono de la videollamada.
 */

// Dominio publico del sitio, para enlaces que viven como rutas web (el
// consentimiento es un documento del sitio). Hecho estable y publico.
const SITIO = 'https://psicologojuanfernandez.cl';

export default function CitaAgendada() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const slugStr = Array.isArray(slug) ? slug[0] : slug;

  const tipo = tipoDeReserva(slugStr);
  const mostrarFonasa = tipo === 'fonasa' || tipo === null;
  const mostrarParticular = tipo === 'particular' || tipo === null;
  const ambos = tipo === null;

  const irInicio = () => router.replace('/');

  return (
    <View style={styles.pantalla}>
      <View style={[styles.barra, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.marca}>{CONFIRMACION.titulo}</Text>
        <Pressable
          onPress={irInicio}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
          hitSlop={8}
          style={({ pressed }) => [styles.inicio, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.inicioTexto}>Inicio</Text>
          <Feather name="home" size={15} color={COLORS.onSage} />
        </Pressable>
      </View>

      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 44 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.encabezado}>
          <Feather name="check-circle" size={56} color={COLORS.sage} />
          <Text style={styles.titulo}>{CONFIRMACION.titulo}</Text>
          <Text style={styles.bajada}>{CONFIRMACION.bajada}</Text>
        </View>

        <Text style={styles.seccion}>Tus próximos pasos</Text>

        {/* Paso 1: consentimiento */}
        <Tarjeta numero={1} titulo={CONSENTIMIENTO.titulo}>
          <Text style={styles.parrafo}>{CONSENTIMIENTO.texto}</Text>
          <Boton onPress={() => abrirUrl(`${SITIO}${CONSENTIMIENTO.ruta}`)} style={{ marginTop: 14 }}>
            {CONSENTIMIENTO.ctaTexto}
          </Boton>
        </Tarjeta>

        {/* Paso 2: pago */}
        <Tarjeta numero={2} titulo="Paga tu sesión antes de la hora">
          {ambos ? (
            <Text style={[styles.parrafo, { fontSize: 13.5, color: COLORS.inkSoft }]}>
              Sigue el bloque que corresponde a la sesión que reservaste.
            </Text>
          ) : null}
          {mostrarFonasa ? <BloqueFonasa data={pasosFonasa(slugStr)} /> : null}
          {mostrarParticular ? (
            <BloqueParticular data={pasosParticular()} conSeparador={ambos} />
          ) : null}
        </Tarjeta>

        {/* Paso 3: llegada */}
        <Tarjeta numero={3} titulo={LLEGADA.titulo}>
          <Text style={styles.parrafo}>{LLEGADA.texto}</Text>
          <Boton variant="secondary" onPress={() => abrirUrl(LLEGADA.url)} style={{ marginTop: 14 }}>
            {LLEGADA.ctaTexto}
          </Boton>
        </Tarjeta>

        <Text style={styles.dudas}>¿Tienes una duda antes de la sesión?</Text>
        <Boton variant="secondary" onPress={() => abrirUrl(CONTACTO.whatsappUrl)}>
          Escribirme por WhatsApp
        </Boton>
      </ScrollView>
    </View>
  );
}

function Tarjeta({ numero, titulo, children }) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaFila}>
        <Text style={styles.numero}>{numero}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tarjetaTitulo}>{titulo}</Text>
          {children}
        </View>
      </View>
    </View>
  );
}

function BloqueFonasa({ data }) {
  return (
    <View>
      <Text style={styles.bloqueTitulo}>{data.titulo}</Text>
      <Text style={styles.parrafo}>{data.intro}</Text>
      <View style={{ marginTop: 8 }}>
        {data.pasos.map((p, i) => (
          <View key={i} style={styles.paso}>
            <Text style={styles.pasoNum}>{i + 1}</Text>
            <Text style={styles.pasoTexto}>{p}</Text>
          </View>
        ))}
      </View>
      <Boton variant="secondary" onPress={() => abrirUrl(data.enlace.url)} style={{ marginTop: 14 }}>
        {data.enlace.texto}
      </Boton>
    </View>
  );
}

function BloqueParticular({ data, conSeparador }) {
  const t = data.transferencia;
  return (
    <View style={conSeparador ? styles.separador : undefined}>
      <Text style={styles.bloqueTitulo}>{data.titulo}</Text>
      <Text style={styles.parrafo}>{data.intro}</Text>

      <Text style={styles.opcion}>Opción 1: WebPay</Text>
      <Boton onPress={() => abrirUrl(data.webpay.url)} style={{ marginTop: 6 }}>
        {data.webpay.texto}
      </Boton>

      <Text style={[styles.opcion, { marginTop: 16 }]}>Opción 2: transferencia electrónica</Text>
      <FilaDato etiqueta="Banco" valor={t.banco} />
      <FilaDato etiqueta="N° de cuenta" valor={t.cuenta} />
      <FilaDato etiqueta="Titular" valor={t.titular} />
      <FilaDato etiqueta="RUT" valor={t.rut} />
      <FilaDato etiqueta="Comprobante a" valor={t.correoComprobante} />
      <Text style={[styles.parrafo, { marginTop: 12 }]}>{data.nota}</Text>
    </View>
  );
}

function FilaDato({ etiqueta, valor }) {
  return (
    <View style={styles.filaDato}>
      <Text style={styles.filaEtiqueta}>{etiqueta}</Text>
      <Text style={styles.filaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.cream },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.sage,
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  marca: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.onSage, letterSpacing: 0.2 },
  inicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.terracotaDeep,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inicioTexto: { fontFamily: FONTS.bodyBold, fontSize: 13.5, color: COLORS.onSage, letterSpacing: 0.2 },
  contenido: { paddingHorizontal: 22, paddingTop: 22 },
  encabezado: { alignItems: 'center', textAlign: 'center', marginBottom: 12 },
  titulo: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.ink, marginTop: 14, textAlign: 'center' },
  bajada: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 380,
  },
  seccion: { fontFamily: FONTS.display, fontSize: 19, color: COLORS.ink, marginTop: 22, marginBottom: 12 },
  tarjeta: {
    backgroundColor: COLORS.offwhite,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 18,
    marginBottom: 14,
  },
  tarjetaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numero: {
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
  tarjetaTitulo: { fontFamily: FONTS.display, fontSize: 17, color: COLORS.ink, marginBottom: 6, marginTop: 2 },
  parrafo: { fontFamily: FONTS.body, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 21 },
  bloqueTitulo: { fontFamily: FONTS.bodyBold, fontSize: 14.5, color: COLORS.ink, marginBottom: 6 },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  pasoNum: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.sage,
    minWidth: 16,
    lineHeight: 21,
  },
  pasoTexto: { flex: 1, fontFamily: FONTS.body, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 21 },
  separador: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: COLORS.line },
  opcion: { fontFamily: FONTS.bodyBold, fontSize: 14.5, color: COLORS.ink, marginTop: 14 },
  filaDato: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  filaEtiqueta: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.inkFaint, minWidth: 120 },
  filaValor: { flex: 1, fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink },
  dudas: { fontFamily: FONTS.bodyMed, fontSize: 15, color: COLORS.ink, textAlign: 'center', marginTop: 8, marginBottom: 12 },
});
