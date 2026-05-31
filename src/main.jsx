import React from 'react';
import ReactDOM from 'react-dom/client';
import { MiniKit } from '@worldcoin/minikit-js';
import App from './App.jsx';
import './index.css';

MiniKit.install('app_0421a6be5285baa95f9b59b01e75d91c');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);