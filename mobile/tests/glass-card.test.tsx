import { render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, Text } from 'react-native';

import { GlassCard } from '@/components/ui/glass-card';

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

describe('GlassCard', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    setPlatform(originalOS as 'ios' | 'android');
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('en iOS usa blur', async () => {
    setPlatform('ios');
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);

    await render(
      <GlassCard>
        <Text>contenido</Text>
      </GlassCard>,
    );

    expect(screen.getByTestId('glass-card-blur')).toBeOnTheScreen();
    expect(screen.getByText('contenido')).toBeOnTheScreen();
  });

  it('en iOS con "Reducir transparencia" cae a la superficie sólida', async () => {
    setPlatform('ios');
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);

    await render(
      <GlassCard>
        <Text>contenido</Text>
      </GlassCard>,
    );

    await waitFor(() => expect(screen.getByTestId('glass-card-fallback')).toBeOnTheScreen());
  });

  it('en Android usa la superficie sólida sin consultar el blur', async () => {
    setPlatform('android');
    const spy = jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled');

    await render(
      <GlassCard>
        <Text>contenido</Text>
      </GlassCard>,
    );

    expect(screen.getByTestId('glass-card-fallback')).toBeOnTheScreen();
    expect(spy).not.toHaveBeenCalled();
  });
});
