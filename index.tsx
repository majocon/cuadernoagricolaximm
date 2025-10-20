import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { v4 as uuidv4 } from 'uuid';

// Global polyfill for components that might rely on it.
(window as any).uuidv4 = uuidv4; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
