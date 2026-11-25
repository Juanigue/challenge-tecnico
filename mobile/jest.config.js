/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  // Sin caché (como en CI) el primer test de cada archivo paga la compilación de
  // las rutas y puede pasar los 5 s por defecto.
  testTimeout: 15000,
  moduleNameMapper: {
    // Ver el comentario en tests/mocks/react-native-reanimated-mock.ts.
    '^react-native-reanimated$': '<rootDir>/tests/mocks/react-native-reanimated.ts',
    '^react-native-reanimated/mock$': '<rootDir>/tests/mocks/react-native-reanimated-mock.ts',
  },
};
