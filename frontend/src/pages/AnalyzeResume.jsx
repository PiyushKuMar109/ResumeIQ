import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { getResumeById } from '../services/resumeService';
import { getJobRoles } from '../services/jobService';
import { analyzeResume } from '../services/analysisService';
import { useToast } from '../context/ToastContext';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function AnalyzeResume() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [resume, setResume] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resumeResponse, rolesResponse] = await Promise.all([
          getResumeById(resumeId),
          getJobRoles(),
        ]);
        setResume(extractData(resumeResponse));
        setJobRoles(extractData(rolesResponse) || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load resume analysis page'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resumeId]);

  const handleAnalyze = async () => {
    if (!resumeId) {
      showToast('Resume ID is missing', 'error');
      return;
    }

    if (!resume?.extracted_text?.trim()) {
      const message = 'Resume extracted text is empty. Please upload or parse the resume again.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    if (!jobRoles.length) {
      const message = 'No job roles found. Please seed job roles first.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    if (!selectedJobRole) {
      const message = 'Please select a job role before analyzing.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');
      const response = await analyzeResume({
        resume_id: Number(resumeId),
        job_role_id: Number(selectedJobRole),
      });
      const data = extractData(response);
      showToast('Resume analyzed successfully', 'success');
      navigate(`/analysis/${data.id}`);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to analyze resume');
      setError(message);
      showToast(message, 'error');
    } finally {
      setAnalyzing(false);
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/resumes/${resumeId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Resume
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Analyze Resume</h1>
          <p className="text-slate-400 text-sm mb-8">
            Select a target role for {resume?.title || 'this resume'} to generate ATS scoring and suggestions.
          </p>

          {error && (
            <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6">
            <div className="bg-slate-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Extracted Resume Summary</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto">
                {resume?.extracted_text || 'No extracted text is available for this resume yet.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Job Role</label>
              {jobRoles.length === 0 && (
                <p className="mb-3 text-sm text-red-400">No job roles found. Please seed job roles first.</p>
              )}
              <select
                value={selectedJobRole}
                onChange={(event) => setSelectedJobRole(event.target.value)}
                disabled={!jobRoles.length}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="">Choose a role...</option>
                {jobRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title} ({role.experience_level || 'Fresher'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !selectedJobRole || !jobRoles.length}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {analyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
