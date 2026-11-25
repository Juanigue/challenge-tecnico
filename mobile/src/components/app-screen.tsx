import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme/theme';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, spacing, typography } from '@/theme/tokens';

import { Icon } from './ui/icon';
import { ScreenBackground } from './ui/screen-background';
import { ThemeToggle } from './ui/theme-toggle';

function goBackHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}

// Marco de las pantallas privadas secundarias (perfil, sesiones, verificación).
export function AppScreen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver al inicio"
                hitSlop={8}
                onPress={goBackHome}
                style={styles.back}>
                <Icon name="back" size={22} />
              </Pressable>
              <ThemeToggle />
            </View>
            <View style={styles.hero}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
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
    gap: spacing.lg,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm },
  hero: { gap: spacing.xs },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
}));
