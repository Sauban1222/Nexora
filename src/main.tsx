import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles.css';

async function startApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Could not find the NEXORA application root.');

  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser.ts');
    await worker.start({ onUnhandledRequest: 'error' });
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void startApp().catch((error: unknown) => {
  console.error('NEXORA could not start its mock REST service worker.', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = '<main role="alert"><h1>NEXORA could not start</h1><p>Refresh the page or check that the mock service worker is available.</p></main>';
  }
});
