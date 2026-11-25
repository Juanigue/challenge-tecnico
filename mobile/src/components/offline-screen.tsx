import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './primary-button';

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        No pudimos conectar con el servidor
      </Text>
      <Text style={styles.body}>Revisá tu conexión e intentá de nuevo. Tu sesión no se cerró.</Text>
      <PrimaryButton title="Reintentar" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'center' },
  body: { fontSize: 15, color: '#444', textAlign: 'center' },
});
