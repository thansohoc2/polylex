import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as ZMPApp } from 'zmp-ui';
import 'zmp-ui/zaui.css';
import './styles/frontend-tailwind-bridge.css';
import '../../frontend/src/i18n/index.ts';
import './styles/override-shared-ui.css';
import App from './App';

function ensureMountElement() {
  const byRoot = document.getElementById('root');
  if (byRoot) {
    return byRoot;
  }

  const byApp = document.getElementById('app');
  if (byApp) {
    byApp.id = 'root';
    return byApp;
  }

  const created = document.createElement('div');
  created.id = 'root';
  document.body.appendChild(created);
  return created;
}

function bootstrap() {
  const mountEl = ensureMountElement();
  ReactDOM.createRoot(mountEl).render(
    <React.StrictMode>
      <ZMPApp>
        <App />
      </ZMPApp>
    </React.StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
