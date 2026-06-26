import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UploadResume from './pages/UploadResume';
import AnalyzeResume from './pages/AnalyzeResume';
import ResumeList from './pages/ResumeList';
import ResumeDetails from './pages/ResumeDetails';
import AnalysisReport from './pages/AnalysisReport';
import InterviewQuestions from './pages/InterviewQuestions';
import JobRecommendations from './pages/JobRecommendations';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload-resume" element={<UploadResume />} />
                <Route path="/resumes" element={<ResumeList />} />
                <Route path="/resumes/:id" element={<ResumeDetails />} />
                <Route path="/analyze/:resumeId" element={<AnalyzeResume />} />
                <Route path="/analysis/:id" element={<AnalysisReport />} />
                <Route path="/interview/:resumeId" element={<InterviewQuestions />} />
                <Route path="/jobs" element={<JobRecommendations />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
