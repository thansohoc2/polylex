import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import App from './App.tsx';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import './index.css';
import './i18n/index.ts';

// Must be called as early as possible — before React mounts.
// If the app crashes before this line, @capgo/capacitor-updater auto-rolls back
// to the previous stable bundle on the next cold start.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
