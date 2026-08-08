import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'resources/js'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/tests/setup.ts'],
        include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
    },
});
