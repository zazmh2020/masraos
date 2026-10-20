import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/** اختبارات تكامل الحماية — على قاعدة اختبار مؤقتة فقط (انظر scripts/auth-hardening.test.ts). */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['scripts/auth-hardening.test.ts', 'scripts/tenant-isolation.test.ts', 'scripts/p01-access.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
