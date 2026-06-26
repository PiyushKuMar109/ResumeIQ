import API from '../api/axios';

export const getJobRoles = () => API.get('/jobs/roles/');

export const createJobRole = (data) =>
  API.post('/jobs/roles/', data);

export const updateJobRole = (id, data) =>
  API.put(`/jobs/roles/${id}/`, data);

export const deleteJobRole = (id) =>
  API.delete(`/jobs/roles/${id}/`);

export const getRecommendations = (data) =>
  API.post('/jobs/recommend/', data);
