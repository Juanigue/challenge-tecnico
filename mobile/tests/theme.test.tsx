import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderRouter } from 'expo-router/testing-library';
import { AccessibilityInfo, Appearance, Platform, Text } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { GlassCard } from '@/components/ui/glass-card';
import { TextField } from '@/components/ui/text-field';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/theme/theme';
import { loadThemePreference } from '@/theme/theme-preference';
import { darkColors, lightColors } from '@/theme/tokens';

import { EXPIRES_AT, jsonResponse, mockFetch, resetMocks, storeToken, USER } from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

const mockColorScheme = jest.fn<'light' | 'dark' | null, []>();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

function setSystemScheme(scheme: 'light' | 'dark' | null) {
  mockColorScheme.mockReturnValue(scheme);
}

describe('Tema claro y oscuro', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('con el sistema en claro usa la paleta clara', async () => {
    setSystemScheme('light');
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toEqual({ scheme: 'light', colors: lightColors });
  });

  it('con el sistema en oscuro usa la paleta oscura', async () => {
    setSystemScheme('dark');
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toEqual({ scheme: 'dark', colors: darkColors });
  });

  it('sin preferencia del sistema usa el oscuro, el diseño original', async () => {
    setSystemScheme(null);
    const { result } = await renderHook(() => useTheme());
    expect(result.current.scheme).toBe('dark');
  });

  it('los componentes toman los colores del tema activo', async () => {
    setSystemScheme('light');
    await render(
      <>
        <TextField label="Email" />
        <Banner kind="error" message="Algo falló" />
      </>,
    );

    expect(screen.getByText('Email')).toHaveStyle({ color: lightColors.textMuted });
    expect(screen.getByText('Algo falló')).toHaveStyle({ color: lightColors.error });
  });

  it('el blur de las tarjetas usa el tint del tema', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
    setSystemScheme('light');

    await render(
      <GlassCard>
        <Text>contenido</Text>
      </GlassCard>,
    );

    expect(screen.getByTestId('glass-card-blur-view')).toHaveProp('tint', 'light');
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS });
  });
});

describe('Botón de modo claro/oscuro', () => {
  beforeEach(resetMocks);
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // En Jest no hay módulo nativo: el spy hace lo que haría iOS, cambiar el esquema.
  function spySetColorScheme() {
    return jest.spyOn(Appearance, 'setColorScheme').mockImplementation((scheme) => {
      mockColorScheme.mockReturnValue(scheme === 'auto' || scheme === 'unspecified' ? null : scheme);
    });
  }

  it('en oscuro pasa a claro, guarda la elección y el botón ofrece volver a oscuro', async () => {
    setSystemScheme('dark');
    const setColorScheme = spySetColorScheme();
    const { rerender } = await render(<ThemeToggle />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar a modo claro' }));

    expect(setColorScheme).toHaveBeenCalledWith('light');
    expect(await SecureStore.getItemAsync('wod.theme')).toBe('light');
    await rerender(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeOnTheScreen();
  });

  it('al abrir la app aplica el modo guardado', async () => {
    const setColorScheme = spySetColorScheme();
    await SecureStore.setItemAsync('wod.theme', 'dark');

    await loadThemePreference();

    expect(setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('sin modo guardado sigue al sistema', async () => {
    const setColorScheme = spySetColorScheme();

    await loadThemePreference();

    expect(setColorScheme).not.toHaveBeenCalled();
  });

  it.each(['/welcome', '/login', '/register', '/forgot-password'])('el encabezado de %s tiene el botón', async (url) => {
    setSystemScheme('dark');
    mockFetch({});
    await renderRouter('src/app', { initialUrl: url });

    expect(await screen.findByRole('button', { name: 'Cambiar a modo claro' })).toBeOnTheScreen();
  });

  it.each(['/home', '/profile', '/sessions', '/verify-email'])('el encabezado de %s tiene el botón', async (url) => {
    setSystemScheme('dark');
    await storeToken();
    mockFetch({
      'GET /auth/me': () => jsonResponse(200, { user: USER, session: { expiresAt: EXPIRES_AT } }),
      'GET /auth/sessions': () => jsonResponse(200, { sessions: [] }),
    });
    await renderRouter('src/app', { initialUrl: url });

    expect(await screen.findByRole('button', { name: 'Cambiar a modo claro' })).toBeOnTheScreen();
  });
});
