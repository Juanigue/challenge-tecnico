// Reanimated 4.7.1 no carga bajo Jest (su inicializador llama a setCSSEventHandler,
// que JSReanimated no implementa) y su mock oficial importa ese mismo entry point.
// jest.config.js redirige ambos nombres a estos archivos. Cubre solo lo que usa la
// app; las animaciones se aplican al instante.
import { ScrollView, Text, View } from 'react-native';

const entering = { duration: () => entering, delay: () => entering };

const Animated = {
  View,
  Text,
  ScrollView,
  createAnimatedComponent: <T>(component: T) => component,
};

export default Animated;
export { ScrollView, Text, View };
export const createAnimatedComponent = Animated.createAnimatedComponent;
export const useReducedMotion = () => false;
export const useSharedValue = <T>(value: T) => ({ value });
export const useAnimatedStyle = <T>(style: () => T) => style();
export const withTiming = <T>(value: T) => value;
export const withRepeat = <T>(value: T) => value;
export const FadeIn = entering;
export const FadeInDown = entering;
