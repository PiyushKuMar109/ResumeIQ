const LOCAL_API_URL = 'http://localhost:8000/api';
const DEFAULT_PRODUCTION_API_URL = 'https://resumeiq-backend.onrender.com/api';

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

export const API_URL = (() => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) {
    return trimTrailingSlashes(configuredUrl);
  }

  if (import.meta.env.DEV) {
    return LOCAL_API_URL;
  }

  return DEFAULT_PRODUCTION_API_URL;
})();

export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  const responseData = error?.response?.data;

  if (responseData?.message) return responseData.message;
  if (responseData?.detail) return responseData.detail;

  if (responseData && typeof responseData === 'object') {
    const firstValue = Object.values(responseData)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === 'string') return firstValue;
  }

  if (!error?.response) {
    return `Unable to reach the server. Check that the frontend is connected to ${API_URL}.`;
  }

  return fallback;
};
