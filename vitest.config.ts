import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    include: [
      '**/__tests__/**/*.{test,spec}.{ts,tsx}',
      '**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', '.expo', 'android', 'ios'],
    css: false,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: [
        'services/**',
        'hooks/**',
        'stores/**',
        'components/**',
        'constants/**',
      ],
      exclude: ['components/ui/**', '**/*.d.ts', 'app/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'tailwind.config': path.resolve(__dirname, './tailwind.config.js'),
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
});
