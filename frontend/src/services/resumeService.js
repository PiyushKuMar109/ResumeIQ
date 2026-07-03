import API from '../api/axios';

export const uploadResume = (formData) =>
  API.post('/resumes/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getResumes = () => API.get('/resumes/');

export const getResumeById = (id) => API.get(`/resumes/${id}/`);

export const deleteResume = (id) => API.delete(`/resumes/${id}/`);

export const parseResume = (id) => API.post(`/resumes/${id}/parse/`);

export const tailorResume = (id, data) => API.post(`/resumes/${id}/tailor/`, data);

