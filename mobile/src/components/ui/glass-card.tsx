import { BlurView } from 'expo-blur';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

// El blur solo se usa en iOS: en Android es experimental en expo-blur y caro.
// Si el usuario activó "Reducir transparencia", también se respeta.
export function useGlassAvailable(): boolean {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => subscription.remove();
  }, []);

  return Platform.OS === 'ios' && !reduceTransparency;
}

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function GlassCard({ children, style, padded = true }: GlassCardProps) {
  const glass = useGlassAvailable();

  return (
    <View
      testID={glass ? 'glass-card-blur' : 'glass-card-fallback'}
      style={[styles.card, padded && styles.padded, !glass && styles.fallback, style]}>
      {glass ? (
        <>
          <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.tint]} />
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  tint: { backgroundColor: colors.glass },
  fallback: { backgroundColor: colors.glassFallback },
});
