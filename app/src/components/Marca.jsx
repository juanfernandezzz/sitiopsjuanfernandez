import { View, Text, StyleSheet } from 'react-native';
import { PRESTADOR } from '@contenido/contacto';
import { COLORS, FONTS } from '../theme/tokens';

export default function Marca() {
  return (
    <View style={styles.fila}>
      <View style={styles.sello}>
        <Text style={styles.jf}>JF</Text>
      </View>
      <View>
        <Text style={styles.nombre}>{PRESTADOR.nombre}</Text>
        <Text style={styles.titulo}>{PRESTADOR.titulo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center' },
  sello: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jf: { fontFamily: FONTS.marca, fontSize: 22, color: COLORS.onSage, letterSpacing: 1 },
  nombre: { fontFamily: FONTS.display, fontSize: 17, color: COLORS.ink },
  titulo: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.sage, letterSpacing: 0.3 },
});
