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

export const generateCoverLetter = (data) => API.post('/resumes/cover-letter/', data);

export const getCareerRoadmap = (resumeId) => API.post('/resumes/career-roadmap/', { resume_id: resumeId });

export const getKeywordDensity = (resumeId, jobDescription) => API.post('/resumes/keyword-density/', { resume_id: resumeId, job_description: jobDescription });

export const refactorCode = (codeText, language) => API.post('/resumes/refactor-code/', { code_text: codeText, language });



