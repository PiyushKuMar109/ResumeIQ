import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Zap, HelpCircle, Sparkles } from 'lucide-react';
import { getResumeById } from '../services/resumeService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function ResumeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const response = await getResumeById(id);
        setResume(extractData(response));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch resume'));
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [id]);

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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/resumes')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Resumes
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {resume && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-3xl font-bold">{resume.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/analyze/${id}`)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  Analyze
                </button>
                <button
                  onClick={() => navigate(`/resumes/${id}/enhance`)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Tailor
                </button>
                <button
                  onClick={() => navigate(`/interview/${id}`)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  Interview
                </button>
              </div>
            </div>

            <div className="space-y-2 text-slate-300 mb-6">
              <p>Status: <span className="text-purple-400">{resume.status}</span></p>
              <p>File Type: {resume.file_type}</p>
              <p>Uploaded: {new Date(resume.uploaded_at).toLocaleString()}</p>
              {resume.file_url && (
                <a
                  href={resume.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-block mt-2"
                >
                  Download Resume
                </a>
              )}
            </div>

            {resume.extracted_text && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Extracted Content</h2>
                <div className="bg-slate-800 rounded-xl p-4 text-slate-200 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
                  {resume.extracted_text}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
