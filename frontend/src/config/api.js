const LOCAL_API_URL = 'http://localhost:8000/api';
const DEFAULT_PRODUCTION_API_URLS = [
  'https://resumeiq-4ebt.onrender.com/api',
  'https://resumeiq-backend.onrender.com/api',
];

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const configuredApiUrls = [
  import.meta.env.VITE_API_URL,
  import.meta.env.VITE_API_BASE_URL,
]
  .filter(Boolean)
  .map((value) => trimTrailingSlashes(value.trim()));

export const API_URLS = [...new Set(
  import.meta.env.DEV
    ? [...configuredApiUrls, LOCAL_API_URL]
    : [...configuredApiUrls, ...DEFAULT_PRODUCTION_API_URLS],
)];

export const API_URL = (() => {
  return API_URLS[0];
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
    return `Unable to reach the server. Check that the frontend is connected to ${API_URLS.join(' or ')}.`;
  }

  return fallback;
};
