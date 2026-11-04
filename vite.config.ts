import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/interpretacao-pce/',
  build: { chunkSizeWarningLimit: 6000 },
});
