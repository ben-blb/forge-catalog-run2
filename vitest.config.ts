import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['default', 'junit'],
    outputFile: { junit: '.reports/junit.xml' },
    projects: [
      {
        test: { name: 'api', root: 'apps/api', include: ['src/**/*.test.ts'] },
      },
      {
        extends: './apps/web/vite.config.ts',
        test: {
          name: 'web',
          root: 'apps/web',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
        },
      },
    ],
  },
});
