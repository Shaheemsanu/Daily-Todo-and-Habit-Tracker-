import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project sites need the repository name here.
  // Set VITE_BASE_PATH=/your-repository-name/ in the GitHub Actions workflow
  // or replace '/' with '/daily-todo-habit-tracker/' before deploying.
  base: process.env.VITE_BASE_PATH || '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
