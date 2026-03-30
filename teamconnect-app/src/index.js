import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import reportWebVitals from './reportWebVitals';

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, options = {}] = args;

  const token = localStorage.getItem('token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    };
  }

  let response = await originalFetch(resource, options);

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
        window.location.href = '/login';
      }
    } else {
      localStorage.clear();
      window.location.href = '/login';
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

reportWebVitals();