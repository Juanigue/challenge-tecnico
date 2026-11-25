// Archivo separado del mock: expo-router/testing-library hace
// jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))
// y si ambos nombres resolvieran al mismo archivo, la factory se requeriría a sí misma.
export * from './react-native-reanimated-mock';
export { default } from './react-native-reanimated-mock';
