import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '@/theme/tokens';

// Gradiente y halos "ambient" del diseño. Es SVG estático: da profundidad sin el
// costo de un blur a pantalla completa. Los halos se desvanecen hacia los bordes y
// se dimensionan según la pantalla, así no quedan cortes visibles en ningún tamaño.
export function ScreenBackground() {
  const { width, height } = useWindowDimensions();
  const glow = Math.max(width, height) * 0.55;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.deep} />
            <Stop offset="0.55" stopColor={palette.ink} />
            <Stop offset="1" stopColor="#03181A" />
          </LinearGradient>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={palette.sage} stopOpacity={0.14} />
            <Stop offset="1" stopColor={palette.sage} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#bg)" />
        <Circle cx={width * 0.95} cy={height * 0.08} r={glow} fill="url(#glow)" />
        <Circle cx={width * 0.05} cy={height * 0.95} r={glow * 0.8} fill="url(#glow)" />
      </Svg>
    </View>
  );
}
