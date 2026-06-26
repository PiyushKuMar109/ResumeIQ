import API from '../api/axios';

export const generateQuestions = (data) =>
  API.post('/interviews/generate/', data);

export const getInterviewsByResume = (resumeId) =>
  API.get(`/interviews/resume/${resumeId}/`);

export const getInterviewById = (id) =>
  API.get(`/interviews/${id}/`);
