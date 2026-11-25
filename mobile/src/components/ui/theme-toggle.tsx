import { Pressable } from 'react-native';

import { makeStyles, useTheme } from '@/theme/theme';
import { setThemePreference } from '@/theme/theme-preference';
import { MIN_TOUCH } from '@/theme/tokens';

import { Icon } from './icon';

// Muestra el ícono del modo al que se cambia: luna en claro, sol en oscuro.
export function ThemeToggle() {
  const { scheme, colors } = useTheme();
  const styles = useStyles();
  const next = scheme === 'dark' ? 'light' : 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={next === 'light' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      hitSlop={4}
      onPress={() => void setThemePreference(next)}
      style={styles.button}>
      <Icon name={next === 'light' ? 'sun' : 'moon'} size={20} color={colors.accentText} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.ghostSurface,
  },
}));
