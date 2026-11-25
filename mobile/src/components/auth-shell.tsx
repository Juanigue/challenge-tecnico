import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme/theme';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, spacing, typography } from '@/theme/tokens';

import { GlassCard } from './ui/glass-card';
import { Icon } from './ui/icon';
import { Logo } from './ui/logo';
import { ScreenBackground } from './ui/screen-background';
import { ThemeToggle } from './ui/theme-toggle';

interface AuthShellProps {
  titleTop: string;
  titleAccent: string;
  subtitle: string;
  cardTitle: string;
  cardSubtitle: string;
  backLabel?: string;
  children: ReactNode;
}

function goBackToWelcome() {
  if (router.canGoBack()) router.back();
  else router.replace('/welcome');
}

export function AuthShell({
  titleTop,
  titleAccent,
  subtitle,
  cardTitle,
  cardSubtitle,
  backLabel = 'Volver a la bienvenida',
  children,
}: AuthShellProps) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const entering = reduceMotion ? undefined : FadeInDown.duration(400);

  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={backLabel}
                hitSlop={8}
                onPress={goBackToWelcome}
                style={styles.back}>
                <Icon name="back" size={22} />
              </Pressable>
              <View style={styles.topBarEnd}>
                <Logo width={72} />
                <ThemeToggle />
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.kicker}>Espacio profesional</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {titleTop}
                {'\n'}
                <Text style={styles.titleAccent}>{titleAccent}</Text>
              </Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <Animated.View entering={entering}>
              <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{cardTitle}</Text>
                  <Text style={styles.cardSubtitle}>{cardSubtitle}</Text>
                </View>
                {children}
              </GlassCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarEnd: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm },
  hero: { gap: spacing.xs },
  kicker: { ...typography.kicker, color: colors.accentText },
  title: { ...typography.title, color: colors.text },
  titleAccent: { color: colors.accentText },
  subtitle: { ...typography.body, color: colors.textMuted },
  card: { gap: spacing.md },
  cardHeader: { gap: spacing.xxs },
  cardTitle: { ...typography.heading, color: colors.text },
  cardSubtitle: { ...typography.body, color: colors.textMuted },
}));
