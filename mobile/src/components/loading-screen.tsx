import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { makeStyles } from '@/theme/theme';
import { radius, spacing, typography } from '@/theme/tokens';

import { Logo } from './ui/logo';
import { ScreenBackground } from './ui/screen-background';

const TRACK_WIDTH = 180;
const BAR_WIDTH = 64;

export function LoadingScreen() {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) progress.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [progress, reduceMotion]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (TRACK_WIDTH - BAR_WIDTH) }],
  }));

  return (
    <View style={styles.container} accessibilityLabel="Verificando sesión" accessibilityRole="progressbar">
      <ScreenBackground />
      <Logo width={120} />
      <View style={styles.copy}>
        <Text style={styles.title}>Preparando tu espacio</Text>
        <Text style={styles.subtitle}>Validando tus credenciales de forma segura…</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, reduceMotion ? styles.barStatic : barStyle]} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, padding: spacing.xl },
  copy: { alignItems: 'center', gap: spacing.xxs },
  title: { ...typography.subheading, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  track: {
    width: TRACK_WIDTH,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.glassBorder,
    overflow: 'hidden',
  },
  bar: { width: BAR_WIDTH, height: 4, borderRadius: radius.pill, backgroundColor: colors.primary },
  barStatic: { width: TRACK_WIDTH },
}));
