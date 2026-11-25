import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { loginSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { AuthShell } from '@/components/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { colors, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  // Los manda la pantalla de registro después de crear la cuenta.
  const params = useLocalSearchParams<{ email?: string; registered?: string }>();
  const justRegistered = params.registered === '1';
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  // La navegación a Home la hace el guard del layout cuando signIn confirma.
  const { submit, isSubmitting } = useSingleSubmit(async () => {
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      await signIn(parsed.data);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  return (
    <AuthShell
      titleTop="Qué bueno"
      titleAccent="verte de nuevo."
      subtitle="Tu equipo y tus entrenamientos están esperándote."
      cardTitle="Accede a WOD"
      cardSubtitle="Ingresa tus datos para continuar.">
      {justRegistered && !formError ? <Banner kind="success" message="Cuenta creada. Ingresá con tu contraseña." /> : null}

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
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!isSubmitting}
      />
      <TextField
        ref={passwordRef}
        label="Contraseña"
        icon="lock"
        password
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        editable={!isSubmitting}
      />

      {formError ? <Banner kind="error" message={formError} /> : null}

      <Button title="Entrar a WOD" icon="arrow" onPress={() => void submit()} loading={isSubmitting} />
      {isSubmitting ? <Text style={styles.progress}>Validando tus credenciales de forma segura…</Text> : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  progress: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
