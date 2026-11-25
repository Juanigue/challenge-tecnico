import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, type TextInputInstance } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { loginSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { AuthShell } from '@/components/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { makeStyles } from '@/theme/theme';
import { typography } from '@/theme/tokens';

export default function LoginScreen() {
  const styles = useStyles();
  const { signIn } = useAuth();
  // Los mandan registro (cuenta creada) y recuperación (contraseña cambiada).
  const params = useLocalSearchParams<{ email?: string; registered?: string; reset?: string }>();
  const notice =
    params.registered === '1'
      ? 'Cuenta creada. Ingresá con tu contraseña.'
      : params.reset === '1'
        ? 'Contraseña actualizada. Ingresá con la nueva.'
        : null;
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
      {notice && !formError ? <Banner kind="success" message={notice} /> : null}

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
      <Link href="/forgot-password" style={styles.forgot} disabled={isSubmitting}>
        ¿Olvidaste tu contraseña?
      </Link>

      {formError ? <Banner kind="error" message={formError} /> : null}

      <Button title="Entrar a WOD" onPress={() => void submit()} loading={isSubmitting} />
      {isSubmitting ? <Text style={styles.progress}>Validando tus credenciales de forma segura…</Text> : null}
    </AuthShell>
  );
}

const useStyles = makeStyles((colors) => ({
  forgot: { ...typography.label, color: colors.accentText, alignSelf: 'flex-end', paddingVertical: 10 },
  progress: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
}));
