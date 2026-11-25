import { render, renderHook, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, Text } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { GlassCard } from '@/components/ui/glass-card';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme';
import { darkColors, lightColors } from '@/theme/tokens';

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
