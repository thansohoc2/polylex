import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';
// Load .env so VITE_* vars are available to process.env during `cap sync`
loadEnv();

const config: CapacitorConfig = {
  appId: 'com.truongphatlab.polylex.app',
  appName: 'PolyLex',
  webDir: 'dist',
  // In production native builds the WebView loads from dist/ directly.
  // Un-comment the server block ONLY during development to enable live-reload:
  // server: {
  //   url: 'http://<YOUR_LOCAL_IP>:5173',
  //   cleartext: true,
  // },
  plugins: {
    // @capacitor/preferences — no extra config needed
    CapacitorUpdater: {
      // Manual mode: app calls download() + set() itself, no auto background polling
      autoUpdate: false,
    },
    GoogleAuth: {
      // Web client ID from Google Console (used for web fallback + backend verify)
      clientId: process.env['VITE_GOOGLE_CLIENT_ID_WEB'] ?? '',
      iosClientId: process.env['VITE_GOOGLE_CLIENT_ID_IOS'] ?? '',
      androidClientId: process.env['VITE_GOOGLE_CLIENT_ID_ANDROID'] ?? '',
      scopes: ['profile', 'email'],
    },
  },
  server: {
  androidScheme: 'https',
  iosScheme: 'https'
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
