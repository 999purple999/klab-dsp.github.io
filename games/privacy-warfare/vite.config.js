import { defineConfig } from 'vite';

export default defineConfig({
  base: '/games/privacy-warfare/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2020',
  },
  server: {
    port: 5174,
  }
});
