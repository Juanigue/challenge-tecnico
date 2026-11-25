import { Image } from 'expo-image';

// Proporción del PNG original (1024 × 832). Decorativa: no se anuncia en accesibilidad.
const ASPECT_RATIO = 1024 / 832;

export function LiftEmblem({ size }: { size: number }) {
  return (
    <Image
      source={require('../../../assets/images/wod-emblem.png')}
      style={{ width: size, height: size / ASPECT_RATIO }}
      contentFit="contain"
      accessible={false}
    />
  );
}
