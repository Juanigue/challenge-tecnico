import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme/theme';
import { MIN_TOUCH, spacing } from '@/theme/tokens';

import { Icon } from './icon';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  invalid?: boolean;
  children: ReactNode;
}

// El texto (children) queda fuera del Pressable para que pueda tener su propio link.
export function Checkbox({ checked, onChange, accessibilityLabel, disabled = false, invalid = false, children }: CheckboxProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={() => onChange(!checked)}
        style={styles.target}>
        <View style={[styles.box, checked && styles.boxChecked, invalid && !checked && styles.boxInvalid]}>
          {checked ? <Icon name="check" size={14} color={colors.onPrimary} /> : null}
        </View>
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  target: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxInvalid: { borderColor: colors.error },
  label: { flex: 1 },
}));
