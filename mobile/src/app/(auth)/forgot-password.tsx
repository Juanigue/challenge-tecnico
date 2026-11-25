import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import * as authApi from '@/auth/auth-api';
import { forgotPasswordSchema, resetPasswordSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { AuthShell } from '@/components/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { makeStyles } from '@/theme/theme';
import { typography } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const styles = useStyles();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { submit: requestCode, isSubmitting: isRequesting } = useSingleSubmit(async () => {
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      await authApi.forgotPassword(parsed.data.email);
      setEmail(parsed.data.email);
      setStep('reset');
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  const { submit: reset, isSubmitting: isResetting } = useSingleSubmit(async () => {
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ email, code, password, confirmPassword });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      await authApi.resetPassword(parsed.data);
      router.replace({ pathname: '/login', params: { email: parsed.data.email, reset: '1' } });
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  if (step === 'email') {
    return (
      <AuthShell
        titleTop="Recuperá"
        titleAccent="tu acceso."
        subtitle="Te enviamos un código de 6 dígitos a tu email."
        cardTitle="Olvidé mi contraseña"
        cardSubtitle="Ingresá el email con el que te registraste."
        backLabel="Volver">
        <TextField
          label="Email profesional"
          icon="mail"
          placeholder="nombre@correo.com"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={() => void requestCode()}
          editable={!isRequesting}
        />
        {formError ? <Banner kind="error" message={formError} /> : null}
        <Button title="Enviar código" icon="arrow" onPress={() => void requestCode()} loading={isRequesting} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titleTop="Elegí una"
      titleAccent="contraseña nueva."
      subtitle="Al cambiarla se cierran todas tus sesiones abiertas."
      cardTitle="Restablecer contraseña"
      cardSubtitle={`Si ${email} tiene una cuenta, te llegó un código. Vence en 15 minutos.`}
      backLabel="Volver">
      <TextField
        label="Código"
        icon="shield"
        placeholder="123456"
        value={code}
        onChangeText={setCode}
        error={fieldErrors.code}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        editable={!isResetting}
      />
      <TextField
        label="Contraseña nueva"
        icon="lock"
        password
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        hint="Entre 12 y 128 caracteres."
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!isResetting}
      />
      <TextField
        label="Confirmar contraseña"
        icon="lock"
        password
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={fieldErrors.confirmPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!isResetting}
      />
      {formError ? <Banner kind="error" message={formError} /> : null}
      <Button title="Cambiar contraseña" icon="arrow" onPress={() => void reset()} loading={isResetting} />
      <Text style={styles.link} accessibilityRole="button" onPress={() => setStep('email')}>
        Pedir otro código
      </Text>
    </AuthShell>
  );
}

const useStyles = makeStyles((colors) => ({
  link: { ...typography.label, color: colors.accentText, textAlign: 'center', paddingVertical: 12 },
}));
