import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { makeStyles } from '@/theme/theme';
import { MAX_CONTENT_WIDTH, radius, spacing, typography } from '@/theme/tokens';

const SECTIONS = [
  {
    title: '1. Uso de la app',
    body: 'WOD es una herramienta para que entrenadores organicen su trabajo y el seguimiento de sus atletas.',
  },
  {
    title: '2. Tu cuenta',
    body: 'Sos responsable de mantener tu contraseña en privado. La sesión se guarda cifrada en este dispositivo.',
  },
  {
    title: '3. Datos',
    body: 'Solo guardamos tu nombre, apellido y email. La contraseña se almacena como un hash, nunca en texto plano.',
  },
];

// Modal demostrativo: el enunciado permite términos de ejemplo claramente identificados.
export default function TermsScreen() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Términos y condiciones
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Texto demostrativo, no es un documento legal</Text>
        </View>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <Button title="Entendido" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: { ...typography.heading, color: colors.text },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.successSurface,
  },
  badgeText: { ...typography.label, color: colors.accentText },
  section: { gap: spacing.xxs },
  sectionTitle: { ...typography.subheading, color: colors.text },
  body: { ...typography.body, color: colors.textMuted },
}));
