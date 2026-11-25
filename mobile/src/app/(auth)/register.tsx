import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View, type TextInputInstance } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { registerSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { AuthShell } from '@/components/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextField } from '@/components/ui/text-field';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { makeStyles } from '@/theme/theme';
import { typography } from '@/theme/tokens';

const PASSWORD_MIN = 12;

function passwordHint(length: number): string {
  if (length >= PASSWORD_MIN) return `${length} caracteres ✓`;
  return `Mínimo ${PASSWORD_MIN} caracteres, podés usar una frase (${length}/${PASSWORD_MIN})`;
}

export default function RegisterScreen() {
  const styles = useStyles();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const lastNameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const setField = (name: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const { submit, isSubmitting } = useSingleSubmit(async () => {
    setFormError(null);
    const parsed = registerSchema.safeParse({ ...form, acceptTerms });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      await signUp(parsed.data);
      // replace: "atrás" no vuelve al formulario ya enviado.
      router.replace({ pathname: '/login', params: { email: parsed.data.email, registered: '1' } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
        setFieldErrors({ email: err.message });
      } else if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields);
      } else {
        setFormError(getErrorMessage(err));
      }
    }
  });

  return (
    <AuthShell
      titleTop="Construye algo"
      titleAccent="extraordinario."
      subtitle="Todo gran progreso empieza con una decisión. Esta es la tuya."
      cardTitle="Crea tu perfil"
      cardSubtitle="Empieza a gestionar mejor tu negocio.">
      <TextField
        label="Nombre"
        icon="user"
        value={form.firstName}
        onChangeText={setField('firstName')}
        error={fieldErrors.firstName}
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => lastNameRef.current?.focus()}
        editable={!isSubmitting}
      />
      <TextField
        ref={lastNameRef}
        label="Apellido"
        icon="user"
        value={form.lastName}
        onChangeText={setField('lastName')}
        error={fieldErrors.lastName}
        autoComplete="family-name"
        textContentType="familyName"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
        editable={!isSubmitting}
      />
      <TextField
        ref={emailRef}
        label="Email profesional"
        icon="mail"
        placeholder="nombre@correo.com"
        value={form.email}
        onChangeText={setField('email')}
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
        value={form.password}
        onChangeText={setField('password')}
        error={fieldErrors.password}
        hint={passwordHint(form.password.length)}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!isSubmitting}
      />
      <TextField
        ref={confirmRef}
        label="Repetir contraseña"
        icon="lock"
        password
        value={form.confirmPassword}
        onChangeText={setField('confirmPassword')}
        error={fieldErrors.confirmPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        editable={!isSubmitting}
      />

      <View>
        <Checkbox
          checked={acceptTerms}
          onChange={setAcceptTerms}
          accessibilityLabel="Acepto los términos y condiciones"
          disabled={isSubmitting}
          invalid={Boolean(fieldErrors.acceptTerms)}>
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Link href="/terms" style={styles.termsLink}>
              términos y condiciones
            </Link>
          </Text>
        </Checkbox>
        {fieldErrors.acceptTerms ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {fieldErrors.acceptTerms}
          </Text>
        ) : null}
      </View>

      {formError ? <Banner kind="error" message={formError} /> : null}

      <Button title="Crear cuenta" onPress={() => void submit()} loading={isSubmitting} />
      {isSubmitting ? <Text style={styles.progress}>Creando tu cuenta…</Text> : null}
    </AuthShell>
  );
}

const useStyles = makeStyles((colors) => ({
  termsText: { ...typography.body, color: colors.textMuted },
  termsLink: { color: colors.accentText, fontWeight: '700', textDecorationLine: 'underline' },
  error: { ...typography.caption, color: colors.error },
  progress: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
}));
