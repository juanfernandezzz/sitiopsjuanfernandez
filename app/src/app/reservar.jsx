import { useState, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { CAL_EVENTS, calInlineEmbedHtml } from '@contenido/cal';
import { SESIONES } from '@contenido/sesiones';
import { COLORS, FONTS } from '../theme/tokens';
import { abrirAgendaExterno } from '../lib/abrir';

/**
 * Pantalla de reserva embebida (C27). Cal.com vive DENTRO de la app dentro de un
 * react-native-webview: no se abre ningun navegador externo con barra ni X. El
 * widget usa la misma configuracion que el sitio (CAL_EMBED_CONFIG en cal.js),
 * asi la reserva se ve igual en todas las plataformas. El slug del evento llega
 * como parametro desde abrirAgenda. Si el embed falla, se ofrece una via externa
 * de respaldo para no dejar nunca al usuario sin forma de reservar.
 */
function tituloDeSlug(slug) {
  const clave = Object.keys(CAL_EVENTS).find((k) => CAL_EVENTS[k] === slug);
  const sesion = clave ? SESIONES.find((s) => s.key === clave) : null;
  return sesion ? sesion.titulo : 'Reserva tu sesión';
}

export default function Reservar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const slugStr = Array.isArray(slug) ? slug[0] : slug;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const html = useMemo(() => (slugStr ? calInlineEmbedHtml(slugStr) : ''), [slugStr]);
  const titulo = useMemo(() => tituloDeSlug(slugStr), [slugStr]);

  return (
    <View style={styles.pantalla}>
      <View style={[styles.barra, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          style={({ pressed }) => [styles.volver, pressed && { opacity: 0.7 }]}
        >
          <Feather name="chevron-left" size={22} color={COLORS.onSage} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.barraTitulo} numberOfLines={1}>
            Reservar
          </Text>
          <Text style={styles.barraSub} numberOfLines={1}>
            {titulo}
          </Text>
        </View>
      </View>

      <View style={styles.cuerpo}>
        {!error && slugStr ? (
          <WebView
            source={{ html, baseUrl: 'https://cal.com' }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            scrollEnabled
            nestedScrollEnabled
            onLoadEnd={() => setCargando(false)}
            onError={() => {
              setError(true);
              setCargando(false);
            }}
            onHttpError={() => {
              setError(true);
              setCargando(false);
            }}
            style={styles.web}
          />
        ) : null}

        {cargando && !error ? (
          <View style={styles.estado} pointerEvents="none">
            <ActivityIndicator size="large" color={COLORS.sage} />
            <Text style={styles.estadoTexto}>Cargando el calendario...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.estado}>
            <Text style={styles.estadoTitulo}>No pudimos mostrar el calendario aquí</Text>
            <Text style={styles.estadoTexto}>
              Abre la agenda y reserva tu hora. Vuelves con un toque.
            </Text>
            <Pressable
              onPress={() => abrirAgendaExterno(slugStr)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.botonFallback, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.botonFallbackTexto}>Abrir agenda</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.cream },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.sage,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  volver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraTitulo: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.onSage,
    letterSpacing: 0.2,
  },
  barraSub: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    color: 'rgba(246,241,232,0.78)',
    marginTop: 1,
  },
  cuerpo: { flex: 1, backgroundColor: COLORS.cream },
  web: { flex: 1, backgroundColor: COLORS.cream },
  estado: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  estadoTitulo: {
    fontFamily: FONTS.display,
    fontSize: 19,
    color: COLORS.ink,
    textAlign: 'center',
  },
  estadoTexto: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  botonFallback: {
    backgroundColor: COLORS.terracotaDeep,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 6,
  },
  botonFallbackTexto: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.onSage,
    letterSpacing: 0.2,
  },
});
