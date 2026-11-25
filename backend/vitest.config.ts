import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Argon2id con 19 MiB por hash hace lentos algunos tests.
    testTimeout: 20000,
  },
});
