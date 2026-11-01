import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

if (typeof window !== 'undefined') {
  if (import.meta.env && import.meta.env.VITE_SUPABASE_URL) {
    window.__HMARKET_SUPABASE_URL__ = import.meta.env.VITE_SUPABASE_URL;
  }
  if (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    window.__HMARKET_SUPABASE_KEY__ = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
