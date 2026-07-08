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
import TailorResume from './pages/TailorResume';
import MockInterview from './pages/MockInterview';
import BookInterviewer from './pages/BookInterviewer';
import LiveCallWorkspace from './pages/LiveCallWorkspace';
import InterviewerDashboard from './pages/InterviewerDashboard';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import JobTracker from './pages/JobTracker';
import CareerRoadmap from './pages/CareerRoadmap';
import KeywordVisualizer from './pages/KeywordVisualizer';
import CodeRefactorer from './pages/CodeRefactorer';
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
                <Route path="/resumes/:id/enhance" element={<TailorResume />} />
                <Route path="/interview-session" element={<MockInterview />} />
                <Route path="/book-interviewer" element={<BookInterviewer />} />
                <Route path="/interviewer-dashboard" element={<InterviewerDashboard />} />
                <Route path="/live-call/:bookingId" element={<LiveCallWorkspace />} />
                <Route path="/cover-letter" element={<CoverLetterGenerator />} />
                <Route path="/job-tracker" element={<JobTracker />} />
                <Route path="/career-roadmap" element={<CareerRoadmap />} />
                <Route path="/keyword-visualizer" element={<KeywordVisualizer />} />
                <Route path="/code-refactorer" element={<CodeRefactorer />} />
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
