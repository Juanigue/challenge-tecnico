import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useTheme } from '@/theme/theme';
import { MIN_TOUCH, radius, spacing, typography } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', icon, loading = false, disabled = false }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isDisabled = disabled || loading;
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const pressTo = (value: number) => {
    if (!reduceMotion) scale.value = withTiming(value, { duration: 120 });
  };

  const isPrimary = variant === 'primary';
  const contentColor = isPrimary ? colors.onPrimary : colors.text;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => pressTo(0.97)}
        onPressOut={() => pressTo(1)}
        style={[styles.base, isPrimary ? styles.primary : styles.ghost, isDisabled && styles.disabled]}>
        {loading ? (
          <ActivityIndicator color={contentColor} />
        ) : (
          <View style={styles.row}>
            <Text style={[styles.text, { color: contentColor }]}>{title}</Text>
            {icon ? <Icon name={icon} size={18} color={contentColor} /> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: Math.max(MIN_TOUCH, 52),
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  ghost: {
    backgroundColor: colors.ghostSurface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: typography.button,
}));
