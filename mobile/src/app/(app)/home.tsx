import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { PrimaryButton } from '@/components/primary-button';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';

export default function HomeScreen() {
  const { state, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { submit: logout, isSubmitting } = useSingleSubmit(async () => {
    setError(null);
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  });

  if (state.status !== 'signedIn') return null;
  const { user, expiresAt } = state;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Hola, {user.firstName}
        </Text>
        <Text style={styles.row}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.row}>{user.email}</Text>
        <Text style={styles.row}>Sesión activa hasta: {new Date(expiresAt).toLocaleString('es-AR')}</Text>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <PrimaryButton title="Cerrar sesión" onPress={() => void logout()} loading={isSubmitting} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 8 },
  row: { fontSize: 16, color: '#333' },
  error: { color: '#c62828', fontSize: 14 },
});
