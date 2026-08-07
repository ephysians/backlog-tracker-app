import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Isolate React into its own chunk so it gets a long-lived cache
          // entry independent of app code changes. React itself never changes
          // between deploys; without this it's bundled into index.js and
          // cache-busted every time any app file changes.
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
