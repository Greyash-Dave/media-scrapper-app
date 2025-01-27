import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './../scrapper-app/static', // Change the build output directory
    emptyOutDir: true, // Optional: clear the output directory before building
  },
});
