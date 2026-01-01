// ==========================================
// CONFIGURACIÓN DE API - EDITAR AQUÍ
// ==========================================

// Para desarrollo local con túnel:
// - Cloudflare Tunnel: 'https://tu-tunel.trycloudflare.com'
// - ngrok: 'https://tu-id.ngrok.io'
// - Localtunnel: 'https://tu-url.loca.lt'
// - O usa variable de entorno: REACT_APP_API_URL

const API_CONFIG = {
  production: 'https://invex-backend-9oa4.onrender.com',  // Backend en Render
  development: 'http://localhost:8000',
  tunnel: 'https://tu-url-de-tunel.trycloudflare.com'
};

// ==========================================

import axios from 'axios';

const getApiBaseUrl = () => {
  // 1. Usar variable de entorno si existe (útil para túneles)
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // 2. Detectar si estamos en desarrollo local (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return API_CONFIG.development.endsWith('/api') 
      ? API_CONFIG.development 
      : `${API_CONFIG.development}/api`;
  }

  // 3. Usar URL de túnel configurada si existe
  if (API_CONFIG.tunnel && API_CONFIG.tunnel !== 'https://tu-url-de-tunel.trycloudflare.com') {
    return API_CONFIG.tunnel.endsWith('/api')
      ? API_CONFIG.tunnel
      : `${API_CONFIG.tunnel}/api`;
  }

  // 4. Usar URL de producción por defecto
  return API_CONFIG.production.endsWith('/api')
    ? API_CONFIG.production
    : `${API_CONFIG.production}/api`;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.url.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          localStorage.setItem('access_token', response.data.access_token);
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('invex_user');
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
