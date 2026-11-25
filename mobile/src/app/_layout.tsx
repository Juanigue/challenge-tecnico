import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { OfflineScreen } from '@/components/offline-screen';

// El splash nativo queda visible hasta que /auth/me responda.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { state, retry } = useAuth();

  useEffect(() => {
    if (state.status !== 'loading') void SplashScreen.hideAsync();
  }, [state.status]);

  if (state.status === 'loading') {
    // Solo se ve al reintentar desde offline; la primera vez lo tapa el splash.
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" accessibilityLabel="Verificando sesión" />
      </View>
    );
  }

  if (state.status === 'offline') return <OfflineScreen onRetry={() => void retry()} />;

  const signedIn = state.status === 'signedIn';
  // Al cambiar el guard, expo-router saca del historial las pantallas que ya no
  // están permitidas: "atrás" no vuelve a Home después del logout.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
