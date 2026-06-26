import API from '../api/axios';

export const register = (data) => API.post('/auth/register/', data);

export const login = (email, password) =>
  API.post('/auth/login/', { email, password });

export const refreshToken = (refresh) =>
  API.post('/auth/token/refresh/', { refresh });

export const logout = (refresh) =>
  API.post('/auth/logout/', { refresh });

export const getProfile = () => API.get('/auth/profile/');

export const updateProfile = (data) =>
  API.put('/auth/profile/update/', data);
