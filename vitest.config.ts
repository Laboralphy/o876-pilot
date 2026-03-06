// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // <-- Activates `describe`, `it`, `expect` globals
        environment: 'node',
    },
});
