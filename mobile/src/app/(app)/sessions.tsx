import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import * as authApi from '@/auth/auth-api';
import type { SessionInfo } from '@/auth/auth-api';
import { useAuth } from '@/auth/auth-context';
import { withToken } from '@/auth/with-token';
import { AppScreen } from '@/components/app-screen';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Icon } from '@/components/ui/icon';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { makeStyles, useTheme } from '@/theme/theme';
import { spacing, typography } from '@/theme/tokens';

function SessionRow({ session, onRevoke, busy }: { session: SessionInfo; onRevoke: () => void; busy: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const device = session.device ?? 'Dispositivo desconocido';
  return (
    <GlassCard style={styles.gap}>
      <View style={styles.row}>
        <Icon name="shield" size={20} color={colors.accentText} />
        <Text style={styles.device} numberOfLines={1}>
          {device}
        </Text>
      </View>
      <Text style={styles.muted}>Último uso: {new Date(session.lastUsedAt).toLocaleString('es-AR')}</Text>
      {session.current ? (
        <Text style={styles.current}>Este dispositivo</Text>
      ) : (
        <Button title={`Cerrar sesión en ${device}`} variant="ghost" icon="close" onPress={onRevoke} disabled={busy} />
      )}
    </GlassCard>
  );
}

export default function SessionsScreen() {
  const { colors } = useTheme();
  const { signOutAll } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await withToken(authApi.listSessions);
      setSessions(res.sessions);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { submit: revoke, isSubmitting: isRevoking } = useSingleSubmit(async (sessionId: number) => {
    setError(null);
    try {
      await withToken((token) => authApi.revokeSession(token, sessionId));
      setSessions((current) => current?.filter((s) => s.id !== sessionId) ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  });

  const { submit: closeAll, isSubmitting: isClosingAll } = useSingleSubmit(async () => {
    setError(null);
    try {
      await signOutAll();
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  });

  const busy = isRevoking || isClosingAll;

  return (
    <AppScreen title="Sesiones abiertas" subtitle="Dispositivos donde tu cuenta está iniciada.">
      {error ? <Banner kind="error" message={error} /> : null}
      {sessions === null && !error ? <ActivityIndicator color={colors.accentText} accessibilityLabel="Cargando sesiones" /> : null}
      {sessions === null && error ? <Button title="Reintentar" variant="ghost" onPress={() => void load()} /> : null}
      {sessions?.map((session) => (
        <SessionRow key={session.id} session={session} onRevoke={() => void revoke(session.id)} busy={busy} />
      ))}
      {sessions ? (
        <Button
          title="Cerrar sesión en todos los dispositivos"
          icon="logout"
          onPress={() => void closeAll()}
          loading={isClosingAll}
          disabled={busy}
        />
      ) : null}
    </AppScreen>
  );
}

const useStyles = makeStyles((colors) => ({
  gap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  device: { ...typography.subheading, color: colors.text, flexShrink: 1 },
  muted: { ...typography.body, color: colors.textMuted },
  current: { ...typography.label, color: colors.success },
}));
