import { Image } from 'expo-image';

// Proporción del PNG original (1024 × 404).
const ASPECT_RATIO = 1024 / 404;

export function Logo({ width = 88 }: { width?: number }) {
  return (
    <Image
      source={require('../../../assets/images/wod-wordmark.png')}
      style={{ width, height: width / ASPECT_RATIO }}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="WOD"
    />
  );
}
