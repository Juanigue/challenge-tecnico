import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { loginSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';

export default function LoginScreen() {
  const { signIn } = useAuth();
  // Los manda la pantalla de registro después de crear la cuenta.
  const params = useLocalSearchParams<{ email?: string; registered?: string }>();
  const justRegistered = params.registered === '1';
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>
            Ingresar a WOD
          </Text>

          {justRegistered ? (
            <Text accessibilityRole="alert" style={styles.success}>
              Cuenta creada. Ingresá con tu contraseña.
            </Text>
          ) : null}

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            editable={!isSubmitting}
          />
          <FormField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            editable={!isSubmitting}
            onSubmitEditing={() => void submit()}
          />

          {formError ? (
            <Text accessibilityRole="alert" style={styles.formError}>
              {formError}
            </Text>
          ) : null}

          <PrimaryButton title="Ingresar" onPress={() => void submit()} loading={isSubmitting} />

          <Link href="/register" replace style={styles.link}>
            ¿No tenés cuenta? Registrate
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
  formError: { color: '#c62828', fontSize: 14 },
  success: { color: '#2e7d32', fontSize: 15 },
  link: { color: '#208AEF', fontSize: 15, textAlign: 'center', paddingVertical: 8 },
});
