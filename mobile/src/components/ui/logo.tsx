import { Image } from 'expo-image';

import { useTheme } from '@/theme/theme';

// Proporción del PNG original (1024 × 404).
const ASPECT_RATIO = 1024 / 404;

export function Logo({ width = 88 }: { width?: number }) {
  const { colors } = useTheme();
  return (
    <Image
      source={require('../../../assets/images/wod-wordmark.png')}
      style={{ width, height: width / ASPECT_RATIO }}
      tintColor={colors.accentText}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="WOD"
    />
  );
}
