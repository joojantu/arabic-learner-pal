
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  // Fallback if the root element is somehow not found.
  const appContainer = document.createElement('div');
  appContainer.id = 'root';
  document.body.appendChild(appContainer);
  console.warn("Root element not found, created one dynamically. Check index.html.");
  const newRoot = ReactDOM.createRoot(appContainer);
  newRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
