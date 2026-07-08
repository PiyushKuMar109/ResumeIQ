import API from '../api/axios';

export const generateQuestions = (data) =>
  API.post('/interviews/generate/', data);

export const getInterviewsByResume = (resumeId) =>
  API.get(`/interviews/resume/${resumeId}/`);

export const getInterviewById = (id) =>
  API.get(`/interviews/${id}/`);

export const startMockSession = (data) =>
  API.post('/interviews/sessions/start/', data);

export const submitMockAnswer = (sessionId, data) =>
  API.post(`/interviews/sessions/${sessionId}/answer/`, data);

export const getMockSessionDetail = (sessionId) =>
  API.get(`/interviews/sessions/${sessionId}/`);

export const getMockSessions = () =>
  API.get('/interviews/sessions/');

export const getInterviewers = () =>
  API.get('/interviews/interviewers/');

export const updateInterviewerProfile = (data) =>
  API.post('/interviews/interviewers/', data);

export const getSlots = (interviewerId) =>
  API.get(interviewerId ? `/interviews/slots/${interviewerId}/` : '/interviews/slots/');

export const createSlot = (data) =>
  API.post('/interviews/slots/', data);

export const bookSlot = (slotId) =>
  API.post(`/interviews/slots/${slotId}/book/`);

export const getBookings = () =>
  API.get('/interviews/bookings/');

export const getInterviewerDashboard = () =>
  API.get('/interviews/dashboard/');

export const addCredits = (amount) =>
  API.post('/interviews/credits/add/', { amount });


