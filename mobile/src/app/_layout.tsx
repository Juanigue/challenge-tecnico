import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo, useState } from 'react';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { LoadingScreen } from '@/components/loading-screen';
import { OfflineScreen } from '@/components/offline-screen';
import { useTheme } from '@/theme/theme';
import { loadThemePreference } from '@/theme/theme-preference';

// El splash nativo queda visible hasta que /auth/me responda y se aplique el
// tema elegido por el usuario (así no se ve un instante el del sistema).
SplashScreen.preventAutoHideAsync();
const themeLoaded = loadThemePreference();

function RootNavigator() {
  const { state, retry } = useAuth();
  const { colors } = useTheme();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    void themeLoaded.then(() => setThemeReady(true));
  }, []);

  useEffect(() => {
    if (state.status !== 'loading' && themeReady) void SplashScreen.hideAsync();
  }, [state.status, themeReady]);

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
