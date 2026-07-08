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

export const getJobApplications = () =>
  API.get('/jobs/applications/');

export const createJobApplication = (data) =>
  API.post('/jobs/applications/', data);

export const updateJobApplication = (id, data) =>
  API.put(`/jobs/applications/${id}/`, data);

export const deleteJobApplication = (id) =>
  API.delete(`/jobs/applications/${id}/`);
