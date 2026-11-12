import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

function missingRootElement(): never {
  throw new Error('Root element #root not found in public/index.html');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') ?? missingRootElement(),
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
