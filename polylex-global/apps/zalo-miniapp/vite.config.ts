import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ZaloMiniApp from 'zmp-vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  envPrefix: ['VITE_'],
  base: '',
  publicDir: resolve(__dirname, '../frontend/public'),
  plugins: [tsconfigPaths(), react(), tailwindcss(), ZaloMiniApp()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../frontend/src'),
      '@mini': resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'www',
    sourcemap: false,
  },

  server: {
    port: 3000,
    strictPort: true,

    // ✅ chỉ dùng cho local dev
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://ebms.store',
        changeOrigin: true,
        secure: true,
      },
    },

    fs: {
      allow: ['..'],
    },
  },
});