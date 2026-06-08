import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';
import Boton from './Boton';

export default function TarjetaSesion({ titulo, precio, detalle, destacada, cta, onPress }) {
  return (
    <View style={[styles.card, destacada && styles.destacada]}>
      {destacada ? <Text style={styles.flag}>Más solicitada</Text> : null}
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.precioFila}>
        <Text style={styles.precio}>{precio}</Text>
        <Text style={styles.duracion}>sesión de 45 minutos</Text>
      </View>
      <Text style={styles.detalle}>{detalle}</Text>
      <Boton onPress={onPress} style={{ marginTop: 16 }}>{cta}</Boton>
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
