import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import reportWebVitals from './reportWebVitals';
// Global fetch interceptor — automatski refresh tokena
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, options = {}] = args;

  // Dodaj token
  const token = localStorage.getItem('token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    };
  }

  let response = await originalFetch(resource, options);

  // Ako je 401, pokušaj refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        const refreshResponse = await originalFetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          }
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          // Ponovi originalni request s novim tokenom
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${data.accessToken}`
          };
          response = await originalFetch(resource, options);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (e) {
        localStorage.clear();
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    } else {
      localStorage.clear();
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
  }

  return response;
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
