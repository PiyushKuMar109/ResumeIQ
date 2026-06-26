import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops if authentication endpoints fail
    if (originalRequest.url.includes('auth/login/') || originalRequest.url.includes('auth/token/refresh/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          
          localStorage.setItem('access_token', access);
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh token fails, clear storage and log out
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login?expired=true';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
