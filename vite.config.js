import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // --- ADD THIS SECTION ---
  // Fix for Konva/esbuild issue
  resolve: {
    mainFields: ['browser', 'module', 'main'],
  },
  // --- END ---
})