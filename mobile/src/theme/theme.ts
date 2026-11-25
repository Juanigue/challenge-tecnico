import { useMemo } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './tokens';

export type ColorScheme = 'light' | 'dark';

// Sigue al sistema. Sin preferencia conocida se usa el oscuro, el diseño original.
export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const scheme: ColorScheme = useColorScheme() === 'light' ? 'light' : 'dark';
  return { scheme, colors: scheme === 'light' ? lightColors : darkColors };
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

// Define los estilos una vez por archivo y los recalcula solo cuando cambia el tema.
export function makeStyles<T extends NamedStyles<T>>(factory: (colors: ThemeColors) => T) {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
