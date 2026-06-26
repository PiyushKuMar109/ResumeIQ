import API from '../api/axios';

export const getSummary = () => API.get('/dashboard/summary/');

export const getAdminSummary = () =>
  API.get('/dashboard/admin/summary/');
