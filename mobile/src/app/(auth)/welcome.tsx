import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { LiftEmblem } from '@/components/ui/lift-emblem';
import { Logo } from '@/components/ui/logo';
import { ScreenBackground } from '@/components/ui/screen-background';
import { colors, MAX_CONTENT_WIDTH, spacing, typography } from '@/theme/tokens';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // La ilustración se achica en pantallas bajas para que los botones queden a la vista.
  const emblemSize = Math.min(width * 0.72, height * 0.36, 300);

  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Logo width={88} />

          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)} style={styles.emblem}>
            <LiftEmblem size={emblemSize} />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(150).duration(500)} style={styles.copy}>
            <Text style={styles.kicker}>Entrena. Lidera. Evoluciona.</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Tu método,{'\n'}
              <Text style={styles.titleAccent}>más potente.</Text>
            </Text>
            <Text style={styles.body}>
              Gestiona tu trabajo y acompaña el progreso de cada atleta desde un solo lugar.
            </Text>
          </Animated.View>

          <View style={styles.actions}>
            <Button title="Crear cuenta" onPress={() => router.push('/register')} />
            <Button title="Iniciar sesión" variant="ghost" onPress={() => router.push('/login')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
    justifyContent: 'space-between',
  },
  emblem: { alignItems: 'center' },
  copy: { gap: spacing.sm },
  kicker: { ...typography.kicker, color: colors.accentText },
  title: { ...typography.hero, color: colors.text },
  titleAccent: { color: colors.accentText },
  body: { ...typography.body, color: colors.textMuted },
  actions: { gap: spacing.sm },
});
