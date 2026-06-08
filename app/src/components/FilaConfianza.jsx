import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/tokens';

export default function FilaConfianza({ texto, icono = 'check' }) {
  return (
    <View style={styles.fila}>
      <Feather name={icono} size={16} color={COLORS.sage} style={{ marginTop: 2 }} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  texto: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft, flex: 1, lineHeight: 21 },
});
