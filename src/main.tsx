import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

/* PWA: static shell cache only — agency data is NEVER cached (see public/sw.js). */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
}

const rootEl = document.getElementById('root');
if (rootEl === null) throw new Error('index.html is missing the #root mount node');
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
