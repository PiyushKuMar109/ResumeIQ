import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Zap, Loader2, AlertCircle } from 'lucide-react';
import { getResumes, deleteResume } from '../services/resumeService';
import { useToast } from '../context/ToastContext';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function ResumeList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setResumes(extractData(await getResumes()) || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch resumes'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      showToast('Resume deleted successfully', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete resume'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
          <p className="text-slate-400 mt-3 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Resumes</h1>
          <button
            onClick={() => navigate('/upload-resume')}
            className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-xl font-semibold text-sm transition cursor-pointer"
          >
            Upload Resume
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {resumes.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 mb-4">No resumes uploaded yet</p>
            <button
              onClick={() => navigate('/upload-resume')}
              className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-xl font-semibold transition cursor-pointer"
            >
              Upload First Resume
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold">{resume.title}</h3>
                  <p className="text-sm text-slate-400">
                    Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()} · Status: {resume.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/resumes/${resume.id}`)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="View"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/analyze/${resume.id}`)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Analyze"
                  >
                    <Zap className="w-5 h-5 text-purple-400" />
                  </button>
                  <button
                    onClick={() => navigate(`/interview/${resume.id}`)}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  >
                    Interview
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition text-red-400 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
