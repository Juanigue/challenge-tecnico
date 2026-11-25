import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors, MIN_TOUCH, radius, spacing, typography } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

interface TextFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  // Campo de contraseña: oculta el texto y muestra el botón del ojo.
  password?: boolean;
  ref?: Ref<TextInputInstance>;
}

export function TextField({ label, icon, error, hint, password = false, ref, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null]}>
        {icon ? <Icon name={icon} size={18} color={focused ? colors.primary : colors.textSubtle} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          keyboardAppearance="dark"
          secureTextEntry={password && !visible}
          style={styles.input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={12}
            onPress={() => setVisible((current) => !current)}
            style={styles.eye}>
            <Icon name={visible ? 'eyeOff' : 'eye'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textMuted },
  box: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
  },
  boxFocused: { borderColor: colors.inputFocus },
  boxError: { borderColor: colors.error },
  input: { flex: 1, minHeight: MIN_TOUCH, fontSize: 16, color: colors.text },
  eye: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  error: { ...typography.caption, color: colors.error },
  hint: { ...typography.caption, color: colors.textSubtle },
});
