import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { LoadingScreen } from '@/components/loading-screen';
import { OfflineScreen } from '@/components/offline-screen';
import { useTheme } from '@/theme/theme';

// El splash nativo queda visible hasta que /auth/me responda.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { state, retry } = useAuth();
  const { colors } = useTheme();

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
  const { scheme, colors } = useTheme();

  // Lo que asoma detrás de las pantallas durante las transiciones: la vista raíz
  // nativa y el contenedor de navegación (blancos por defecto).
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: colors.background, card: colors.background } };
  }, [scheme, colors.background]);

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
