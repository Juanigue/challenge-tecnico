/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  moduleNameMapper: {
    // Ver el comentario en tests/mocks/react-native-reanimated-mock.ts.
    '^react-native-reanimated$': '<rootDir>/tests/mocks/react-native-reanimated.ts',
    '^react-native-reanimated/mock$': '<rootDir>/tests/mocks/react-native-reanimated-mock.ts',
  },
};
