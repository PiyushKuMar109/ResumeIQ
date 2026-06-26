import API from '../api/axios';

export const generateReport = (data) =>
  API.post('/reports/generate/', data);

export const getReports = () => API.get('/reports/');

export const downloadReport = (id) =>
  API.get(`/reports/${id}/download/`);
