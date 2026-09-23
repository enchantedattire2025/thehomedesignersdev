import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure service worker and manifest are copied to dist
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name === 'service-worker.js' || name === 'manifest.json') {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'icons': ['lucide-react'],
          'charts': ['recharts'],
        },
      },
    },
  },
});
