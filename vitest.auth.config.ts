import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['scripts/auth-security.test.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
