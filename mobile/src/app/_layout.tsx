import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { LoadingScreen } from '@/components/loading-screen';
import { OfflineScreen } from '@/components/offline-screen';
import { colors } from '@/theme/tokens';

// El splash nativo queda visible hasta que /auth/me responda.
SplashScreen.preventAutoHideAsync();
// Lo que asoma detrás de las pantallas durante las transiciones: la vista raíz
// nativa y el contenedor de navegación (blancos por defecto).
void SystemUI.setBackgroundColorAsync(colors.background);
const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background },
};

function RootNavigator() {
  const { state, retry } = useAuth();

  useEffect(() => {
    if (state.status !== 'loading') void SplashScreen.hideAsync();
  }, [state.status]);

  // Solo se ve al reintentar desde offline; la primera vez lo tapa el splash.
  if (state.status === 'loading') return <LoadingScreen />;

  if (state.status === 'offline') return <OfflineScreen onRetry={() => void retry()} />;

  const signedIn = state.status === 'signedIn';
  // Al cambiar el guard, expo-router saca del historial las pantallas que ya no
  // están permitidas: "atrás" no vuelve a Home después del logout.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
