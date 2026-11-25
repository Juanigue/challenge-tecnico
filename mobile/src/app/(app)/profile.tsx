import { useState } from 'react';

import * as authApi from '@/auth/auth-api';
import { useAuth } from '@/auth/auth-context';
import { profileSchema, toFieldErrors, type FieldErrors } from '@/auth/schemas';
import { withToken } from '@/auth/with-token';
import { AppScreen } from '@/components/app-screen';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { TextField } from '@/components/ui/text-field';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const { state, setUser } = useAuth();
  const user = state.status === 'signedIn' ? state.user : null;
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { submit, isSubmitting } = useSingleSubmit(async () => {
    setFormError(null);
    setSaved(false);
    const parsed = profileSchema.safeParse({ firstName, lastName });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      const res = await withToken((token) => authApi.updateProfile(token, parsed.data));
      setUser(res.user);
      setSaved(true);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  if (!user) return null;
  const unchanged = firstName.trim() === user.firstName && lastName.trim() === user.lastName;

  return (
    <AppScreen title="Mi perfil" subtitle={user.email}>
      <GlassCard style={{ gap: spacing.md }}>
        <TextField
          label="Nombre"
          icon="user"
          value={firstName}
          onChangeText={setFirstName}
          error={fieldErrors.firstName}
          autoComplete="given-name"
          maxLength={50}
          editable={!isSubmitting}
        />
        <TextField
          label="Apellido"
          icon="user"
          value={lastName}
          onChangeText={setLastName}
          error={fieldErrors.lastName}
          autoComplete="family-name"
          maxLength={50}
          editable={!isSubmitting}
        />
        {formError ? <Banner kind="error" message={formError} /> : null}
        {saved && !formError ? <Banner kind="success" message="Perfil actualizado." /> : null}
        <Button
          title="Guardar cambios"
          icon="check"
          onPress={() => void submit()}
          loading={isSubmitting}
          disabled={unchanged}
        />
      </GlassCard>
    </AppScreen>
  );
}
