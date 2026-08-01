import { View, Text, StyleSheet } from 'react-native';
import { AVISO_SIN_CUPOS } from '@contenido/sesiones';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';
import Boton from './Boton';

export default function TarjetaSesion({ titulo, precio, detalle, destacada, cta, onPress, sinCupos }) {
  return (
    <View style={[styles.card, destacada && styles.destacada]}>
      {destacada ? <Text style={styles.flag}>Más solicitada</Text> : null}
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.precioFila}>
        <Text style={styles.precio}>{precio}</Text>
        <Text style={styles.duracion}>sesión de 45 minutos</Text>
      </View>
      <Text style={styles.detalle}>{detalle}</Text>
      {/* Sin cupos: el boton no se monta, para que no quede accionable debajo
          del velo (en RN el overlay no bloquea el touch de un hijo hermano si
          este queda por encima en el orden de render). */}
      {sinCupos ? null : <Boton onPress={onPress} style={{ marginTop: 16 }}>{cta}</Boton>}

      {/* Velo crema translucido con la etiqueta al centro: apaga la tarjeta sin
          oscurecerla, el contenido se sigue leyendo detras. */}
      {sinCupos ? (
        <View style={styles.velo} pointerEvents="auto">
          <View style={styles.pildora}>
            <View style={styles.punto} />
            <Text style={styles.pildoraTexto}>{AVISO_SIN_CUPOS}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.offwhite,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  destacada: { borderColor: COLORS.terracota, borderWidth: 1.5 },
  // Sesion que existe pero no toma reservas: se apaga, no se esconde.
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(246,241,232,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.offwhite,
    borderWidth: 1,
    borderColor: 'rgba(63,91,74,0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#2A3B4C',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(63,91,74,0.45)' },
  pildoraTexto: { fontFamily: FONTS.bodyMed, fontSize: 12, color: COLORS.sage },
  flag: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.terracota,
    marginBottom: 8,
  },
  titulo: { fontFamily: FONTS.display, fontSize: 19, color: COLORS.ink, marginBottom: 6 },
  precioFila: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  precio: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.ink, marginRight: 10 },
  duracion: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.sage },
  detalle: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, marginTop: 8, lineHeight: 22 },
});
