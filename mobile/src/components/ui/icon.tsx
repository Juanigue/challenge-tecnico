import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/theme';

// Íconos del prototipo de Figma (trazo 1.8 sobre una grilla de 24).
const paths = {
  arrow: (
    <>
      <Path d="M5 12h14" />
      <Path d="m14 7 5 5-5 5" />
    </>
  ),
  back: (
    <>
      <Path d="M19 12H5" />
      <Path d="m10 7-5 5 5 5" />
    </>
  ),
  eye: (
    <>
      <Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <Circle cx="12" cy="12" r="2.5" />
    </>
  ),
  eyeOff: (
    <>
      <Path d="m3 3 18 18" />
      <Path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-2.1 2.8M6.1 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9.6 9.6 0 0 0 4-.9" />
    </>
  ),
  lock: (
    <>
      <Rect x="5" y="10" width="14" height="10" rx="3" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Path d="m4 7 8 6 8-6" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <Circle cx="9" cy="8" r="3.5" />
      <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <Path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  clipboard: (
    <>
      <Rect x="5" y="4" width="14" height="17" rx="3" />
      <Path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  shield: (
    <>
      <Path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <Path d="m12 2 1.5 5.1L18 10l-4.5 2.9L12 18l-1.5-5.1L6 10l4.5-2.9L12 2Z" />
      <Path d="m19 16 .7 2.3L22 19.7 19.7 21 19 23l-.7-2-2.3-1.3 2.3-1.4L19 16Z" />
    </>
  ),
  trend: (
    <>
      <Path d="M4 17 9 12l4 3 7-8" />
      <Path d="M15 7h5v5" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  logout: (
    <>
      <Path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <Path d="M14 8l4 4-4 4M9 12h9" />
    </>
  ),
  check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  alert: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  wifiOff: (
    <>
      <Path d="m3 3 18 18" />
      <Path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9.5a14.5 14.5 0 0 1 4.3-2.8M11 6a14.5 14.5 0 0 1 11 3.5" />
      <Path d="M12 20h.01" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? colors.text}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}>
      {paths[name]}
    </Svg>
  );
}
