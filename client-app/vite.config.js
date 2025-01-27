import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/scrape': {
        target: 'http://localhost:3000', // Your Node.js backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});