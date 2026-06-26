import API from '../api/axios';

export const analyzeResume = (data) =>
  API.post('/analysis/analyze/', data);

export const getAnalysisById = (id) =>
  API.get(`/analysis/${id}/`);

export const getAnalysisByResume = (resumeId) =>
  API.get(`/analysis/resume/${resumeId}/`);

export const getAnalysisHistory = () =>
  API.get('/analysis/history/');
