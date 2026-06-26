import API from '../api/axios';

// Auth Service
export const authService = {
  register: (data) =>
    API.post('/auth/register/', data),
  login: (email, password) =>
    API.post('/auth/login/', { email, password }),
  refreshToken: (refreshToken) =>
    API.post('/auth/token/refresh/', { refresh: refreshToken }),
  logout: (refreshToken) =>
    API.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () =>
    API.get('/auth/profile/'),
  updateProfile: (data) =>
    API.put('/auth/profile/update/', data),
};

// Resume Service
export const resumeService = {
  uploadResume: (formData) =>
    API.post('/resumes/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getResumes: () =>
    API.get('/resumes/'),
  getResumeById: (id) =>
    API.get(`/resumes/${id}/`),
  deleteResume: (id) =>
    API.delete(`/resumes/${id}/`),
  parseResume: (id) =>
    API.post(`/resumes/${id}/parse/`),
};

// Analysis Service
export const analysisService = {
  analyzeResume: (data) =>
    API.post('/analysis/analyze/', data),
  getAnalysisById: (id) =>
    API.get(`/analysis/${id}/`),
  getAnalysisByResume: (resumeId) =>
    API.get(`/analysis/resume/${resumeId}/`),
  getAnalysisHistory: () =>
    API.get('/analysis/history/'),
};

// Job Service
export const jobService = {
  getJobRoles: () =>
    API.get('/jobs/roles/'),
  createJobRole: (data) =>
    API.post('/jobs/roles/', data),
  updateJobRole: (id, data) =>
    API.put(`/jobs/roles/${id}/`, data),
  deleteJobRole: (id) =>
    API.delete(`/jobs/roles/${id}/`),
  getRecommendations: (data) =>
    API.post('/jobs/recommend/', data),
};

// Interview Service
export const interviewService = {
  generateQuestions: (data) =>
    API.post('/interviews/generate/', data),
  getInterviewsByResume: (resumeId) =>
    API.get(`/interviews/resume/${resumeId}/`),
  getInterviewById: (id) =>
    API.get(`/interviews/${id}/`),
};

// Report Service
export const reportService = {
  generateReport: (data) =>
    API.post('/reports/generate/', data),
  getReports: () =>
    API.get('/reports/'),
  downloadReport: (id) =>
    API.get(`/reports/${id}/download/`),
};

// Dashboard Service
export const dashboardService = {
  getSummary: () =>
    API.get('/dashboard/summary/'),
  getAdminSummary: () =>
    API.get('/dashboard/admin/summary/'),
};
