import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { registerSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { ApiError, getErrorMessage } from '@/lib/api-client';

export default function RegisterScreen() {
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>
            Crear cuenta de entrenador
          </Text>

          <FormField
            label="Nombre"
            value={form.firstName}
            onChangeText={setField('firstName')}
            error={fieldErrors.firstName}
            autoComplete="given-name"
            textContentType="givenName"
            editable={!isSubmitting}
          />
          <FormField
            label="Apellido"
            value={form.lastName}
            onChangeText={setField('lastName')}
            error={fieldErrors.lastName}
            autoComplete="family-name"
            textContentType="familyName"
            editable={!isSubmitting}
          />
          <FormField
            label="Email"
            value={form.email}
            onChangeText={setField('email')}
            error={fieldErrors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            editable={!isSubmitting}
          />
          <FormField
            label="Contraseña"
            value={form.password}
            onChangeText={setField('password')}
            error={fieldErrors.password}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!isSubmitting}
          />
          <FormField
            label="Repetir contraseña"
            value={form.confirmPassword}
            onChangeText={setField('confirmPassword')}
            error={fieldErrors.confirmPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!isSubmitting}
          />

          <View style={styles.terms}>
            <Switch
              accessibilityLabel="Acepto los términos y condiciones"
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              disabled={isSubmitting}
            />
            <Text style={styles.termsText}>Acepto los términos y condiciones</Text>
          </View>
          {fieldErrors.acceptTerms ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {fieldErrors.acceptTerms}
            </Text>
          ) : null}

          {formError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {formError}
            </Text>
          ) : null}

          <PrimaryButton title="Crear cuenta" onPress={() => void submit()} loading={isSubmitting} />

          <Link href="/login" replace style={styles.link}>
            ¿Ya tenés cuenta? Ingresá
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  content: { padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 8 },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  termsText: { flex: 1, fontSize: 15, color: '#111' },
  error: { color: '#c62828', fontSize: 14 },
  link: { color: '#208AEF', fontSize: 15, textAlign: 'center', paddingVertical: 8 },
});
