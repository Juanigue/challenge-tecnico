import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

import type { ColorScheme } from './theme';

const THEME_KEY = 'wod.theme';

// Fuerza el modo en toda la app (también teclado, blur y barra de estado).
// useColorScheme se actualiza solo, así que useTheme no necesita cambios.
export async function setThemePreference(scheme: ColorScheme): Promise<void> {
  Appearance.setColorScheme(scheme);
  await SecureStore.setItemAsync(THEME_KEY, scheme);
}

// Sin preferencia guardada (o si falla la lectura) la app sigue al sistema.
export async function loadThemePreference(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(THEME_KEY);
    if (saved === 'light' || saved === 'dark') Appearance.setColorScheme(saved);
  } catch {
    // Se queda con el tema del sistema.
  }
}
