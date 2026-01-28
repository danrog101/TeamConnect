// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
export const BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

// For use in fetch calls
window.API_URL = API_URL;
