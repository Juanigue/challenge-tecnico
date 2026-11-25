import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/theme/theme';
import { MAX_CONTENT_WIDTH, spacing, typography } from '@/theme/tokens';

import { Button } from './ui/button';
import { GlassCard } from './ui/glass-card';
import { Icon } from './ui/icon';
import { ScreenBackground } from './ui/screen-background';

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <SafeAreaView style={styles.center}>
        <GlassCard style={styles.card}>
          <Icon name="wifiOff" size={36} color={colors.accentText} />
          <Text accessibilityRole="header" style={styles.title}>
            No pudimos conectar con el servidor
          </Text>
          <Text style={styles.body}>Revisá tu conexión e intentá de nuevo. Tu sesión no se cerró.</Text>
          <View style={styles.action}>
            <Button title="Reintentar" onPress={onRetry} />
          </View>
        </GlassCard>
      </SafeAreaView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', alignItems: 'center', gap: spacing.md },
  title: { ...typography.subheading, color: colors.text, textAlign: 'center' },
  body: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  action: { alignSelf: 'stretch' },
}));
