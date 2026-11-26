import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootEl = document.getElementById('root');
if (rootEl === null) throw new Error('index.html is missing the #root mount node');
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
