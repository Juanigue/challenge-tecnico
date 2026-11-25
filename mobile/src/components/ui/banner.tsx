import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { Icon } from './icon';

interface BannerProps {
  kind: 'error' | 'success';
  message: string;
}

export function Banner({ kind, message }: BannerProps) {
  const isError = kind === 'error';
  const tone = isError ? colors.error : colors.success;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: isError ? colors.errorSurface : colors.successSurface, borderColor: tone }]}>
      <Icon name={isError ? 'alert' : 'check'} size={18} color={tone} />
      <Text style={[styles.text, { color: tone }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  text: { ...typography.label, flex: 1 },
});
