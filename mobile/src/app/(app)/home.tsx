import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { getErrorMessage } from '@/lib/api-client';
import { makeStyles, useTheme } from '@/theme/theme';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, spacing, typography } from '@/theme/tokens';

function greetingFor(hour: number): string {
  if (hour < 12) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function DemoCard({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <GlassCard style={styles.demoCard}>
      <View style={styles.demoHeader}>
        <Icon name={icon} size={22} color={colors.accentText} />
        <Text style={styles.demoTag}>Demo</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{description}</Text>
    </GlassCard>
  );
}

function NavRow({ icon, label, href }: { icon: IconName; label: string; href: '/profile' | '/sessions' }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)} style={styles.navRow}>
      <Icon name={icon} size={20} color={colors.accentText} />
      <Text style={[styles.body, styles.flex]}>{label}</Text>
      <Icon name="arrow" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { state, signOut } = useAuth();
  const reduceMotion = useReducedMotion();
  const [error, setError] = useState<string | null>(null);

  const { submit: logout, isSubmitting } = useSingleSubmit(async () => {
    setError(null);
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  });

  if (state.status !== 'signedIn') return null;
  const { user, expiresAt } = state;
  const now = new Date();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  const enter = (delay: number) => (reduceMotion ? undefined : FadeInDown.delay(delay).duration(400));

  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Logo width={64} />
            <View style={styles.headerUser}>
              <ThemeToggle />
              <View style={styles.headerText}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.headerRole}>Entrenador</Text>
              </View>
              <View style={styles.avatar} accessible={false}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
          </View>

          <Animated.View entering={enter(0)} style={styles.greeting}>
            <Text style={styles.overline}>
              {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {greetingFor(now.getHours())}, {user.firstName}.
            </Text>
            <Text style={styles.muted}>Tu equipo está avanzando. Sigue así.</Text>
          </Animated.View>

          {!user.emailVerified ? (
            <GlassCard style={styles.gap}>
              <View style={styles.row}>
                <Icon name="alert" size={22} color={colors.accentText} />
                <Text style={styles.cardTitle}>Verificá tu email</Text>
              </View>
              <Text style={styles.muted}>Te enviamos un código a {user.email}.</Text>
              <Button title="Ingresar código" variant="ghost" icon="mail" onPress={() => router.push('/verify-email')} />
            </GlassCard>
          ) : null}

          <Animated.View entering={enter(100)}>
            <GlassCard style={styles.gap}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <Icon name="shield" size={22} color={colors.accentText} />
                  <Text style={styles.cardTitle}>Tu sesión</Text>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Activa</Text>
                </View>
              </View>
              <Text style={styles.body}>{user.email}</Text>
              <View style={styles.row}>
                <Icon name="clock" size={16} color={colors.textMuted} />
                <Text style={styles.muted}>Vence: {new Date(expiresAt).toLocaleString('es-AR')}</Text>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={enter(200)} style={styles.demoGrid}>
            <DemoCard icon="users" title="Mis alumnos" description="Seguimiento de cada atleta." />
            <DemoCard icon="clipboard" title="Rutinas" description="Planificá los entrenamientos." />
          </Animated.View>

          <Animated.View entering={enter(300)}>
            <GlassCard style={styles.gap}>
              <View style={styles.row}>
                <Icon name="user" size={22} color={colors.accentText} />
                <Text style={styles.cardTitle}>Mi perfil</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.muted}>Nombre</Text>
                <Text style={styles.body}>
                  {user.firstName} {user.lastName}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.muted}>Email</Text>
                <Text style={styles.body}>{user.email}</Text>
              </View>
              <NavRow icon="user" label="Editar perfil" href="/profile" />
              <NavRow icon="shield" label="Sesiones abiertas" href="/sessions" />
            </GlassCard>
          </Animated.View>

          {error ? <Banner kind="error" message={error} /> : null}
          <Button
            title="Cerrar sesión"
            variant="ghost"
            icon="logout"
            onPress={() => void logout()}
            loading={isSubmitting}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  headerText: { alignItems: 'flex-end', flexShrink: 1 },
  headerName: { ...typography.label, color: colors.text },
  headerRole: { ...typography.caption, color: colors.accentText },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.onPrimary },
  greeting: { gap: spacing.xxs },
  overline: { ...typography.kicker, color: colors.accentText },
  title: { ...typography.title, color: colors.text },
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...typography.subheading, color: colors.text },
  body: { ...typography.body, color: colors.text },
  muted: { ...typography.body, color: colors.textMuted },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.successSurface,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { ...typography.label, color: colors.success },
  demoGrid: { flexDirection: 'row', gap: spacing.sm },
  demoCard: { flex: 1, gap: spacing.xs },
  demoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demoTag: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.accentText,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  profileRow: { gap: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH },
}));
