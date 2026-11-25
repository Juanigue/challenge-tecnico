import { router } from 'expo-router';
import { useState } from 'react';

import * as authApi from '@/auth/auth-api';
import { useAuth } from '@/auth/auth-context';
import { codeSchema } from '@/auth/schemas';
import { withToken } from '@/auth/with-token';
import { AppScreen } from '@/components/app-screen';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { TextField } from '@/components/ui/text-field';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { spacing } from '@/theme/tokens';

export default function VerifyEmailScreen() {
  const { state, setUser } = useAuth();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { submit: verify, isSubmitting: isVerifying } = useSingleSubmit(async () => {
    setFormError(null);
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message);
      return;
    }
    setCodeError(undefined);
    try {
      const res = await withToken((token) => authApi.verifyEmail(token, parsed.data));
      setUser(res.user);
      router.replace('/home');
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  const { submit: resend, isSubmitting: isResending } = useSingleSubmit(async () => {
    setFormError(null);
    setNotice(null);
    try {
      await withToken(authApi.requestEmailVerification);
      setNotice('Te enviamos un código nuevo.');
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  if (state.status !== 'signedIn') return null;
  const busy = isVerifying || isResending;

  return (
    <AppScreen title="Verificá tu email" subtitle={`Ingresá el código de 6 dígitos que enviamos a ${state.user.email}.`}>
      <GlassCard style={{ gap: spacing.md }}>
        <TextField
          label="Código"
          icon="shield"
          placeholder="123456"
          value={code}
          onChangeText={setCode}
          error={codeError}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={() => void verify()}
          editable={!busy}
        />
        {formError ? <Banner kind="error" message={formError} /> : null}
        {notice && !formError ? <Banner kind="success" message={notice} /> : null}
        <Button title="Verificar" icon="check" onPress={() => void verify()} loading={isVerifying} disabled={busy} />
        <Button
          title="Reenviar código"
          variant="ghost"
          icon="mail"
          onPress={() => void resend()}
          loading={isResending}
          disabled={busy}
        />
      </GlassCard>
    </AppScreen>
  );
}
