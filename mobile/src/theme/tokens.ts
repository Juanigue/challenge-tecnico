import { Platform } from 'react-native';

// Paleta del diseño (de más oscuro a más claro).
export const palette = {
  ink: '#051F20',
  deep: '#0B2B26',
  forest: '#163832',
  moss: '#235347',
  sage: '#8EB69B',
  mint: '#DAF1DE',
} as const;

export const colors = {
  background: palette.ink,
  backgroundAlt: palette.deep,
  primary: palette.sage,
  onPrimary: palette.ink,
  text: '#F2F7F3',
  textMuted: 'rgba(218, 241, 222, 0.68)',
  textSubtle: 'rgba(218, 241, 222, 0.48)',
  accentText: palette.sage,
  // Superficies glass: la capa translúcida va arriba del blur (iOS) o sola (fallback).
  glass: 'rgba(22, 56, 50, 0.45)',
  glassFallback: 'rgba(22, 56, 50, 0.94)',
  glassBorder: 'rgba(142, 182, 155, 0.22)',
  input: 'rgba(5, 31, 32, 0.55)',
  inputBorder: 'rgba(142, 182, 155, 0.22)',
  inputFocus: palette.sage,
  error: '#FF8A80',
  errorSurface: 'rgba(255, 138, 128, 0.12)',
  success: '#A8E0B6',
  successSurface: 'rgba(168, 224, 182, 0.12)',
} as const;

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;

export const radius = { sm: 12, md: 16, lg: 24, pill: 999 } as const;

// Alto mínimo de cualquier elemento tocable (iOS HIG 44, Material 48).
export const MIN_TOUCH = 48;

// Ancho máximo del contenido en tablets y pantallas grandes.
export const MAX_CONTENT_WIDTH = 480;

const display = Platform.select({ ios: 'System', default: 'sans-serif' });
const condensed = Platform.select({ ios: 'System', default: 'sans-serif-condensed' });

export const fonts = { display, condensed } as const;

export const typography = {
  hero: { fontSize: 44, lineHeight: 46, fontWeight: '800', letterSpacing: -1.5 },
  title: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  kicker: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 2.4, textTransform: 'uppercase' },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
} as const;
