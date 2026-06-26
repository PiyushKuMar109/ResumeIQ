import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const publicUrls = ['/auth/login/', '/auth/register/', '/auth/token/refresh/'];

const ensureTrailingSlash = (url) => {
  if (!url || url.includes('?')) return url;
  return url.endsWith('/') ? url : `${url}/`;
};

API.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = ensureTrailingSlash(config.url);
    }

    const isPublic = publicUrls.some((url) => config.url?.includes(url));

    if (!isPublic) {
      const token = localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?expired=true';
  }
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest?.url?.includes('auth/login/') ||
      originalRequest?.url?.includes('auth/register/') ||
      originalRequest?.url?.includes('auth/token/refresh/')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh');

      if (!refreshToken) {
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const access = response.data.access;
        localStorage.setItem('access', access);
        if (response.data.refresh) {
          localStorage.setItem('refresh', response.data.refresh);
        }

        processQueue(null, access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
