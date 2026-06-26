import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getRecommendations } from '../services/jobService';
import { getResumes } from '../services/resumeService';
import { useToast } from '../context/ToastContext';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function JobRecommendations() {
  const location = useLocation();
  const { showToast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const response = await getResumes();
        setResumes(extractData(response) || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch resumes'));
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  useEffect(() => {
    const resumeId = location.state?.resumeId;
    if (resumeId) {
      setSelectedResume(String(resumeId));
    }
  }, [location.state]);

  const handleGetRecommendations = async () => {
    if (!selectedResume) {
      showToast('Please select a resume', 'error');
      return;
    }

    setRecommending(true);
    setError('');

    try {
      const response = await getRecommendations({ resume_id: Number(selectedResume) });
      setRecommendations(extractData(response));
      showToast('Job recommendations loaded!', 'success');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to get recommendations');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setRecommending(false);
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

  const recList = Array.isArray(recommendations) ? recommendations : recommendations ? [recommendations] : [];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Job Recommendations</h1>
        <p className="text-slate-400 text-sm mb-8">Select a resume to find matching job roles.</p>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Your Resume</label>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500"
              >
                <option value="">Choose a resume...</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGetRecommendations}
              disabled={recommending || !selectedResume}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {recommending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                'Get Job Recommendations'
              )}
            </button>
          </div>
        </div>

        {recList.length > 0 && (
          <div className="space-y-4">
            {recList.map((rec, idx) => (
              <div key={rec.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-1">{rec.job_title || 'Recommended Job'}</h2>
                {rec.company_name && <p className="text-sm text-slate-400 mb-3">{rec.company_name}</p>}
                {rec.reason && <p className="text-slate-300 text-sm mb-4">{rec.reason}</p>}
                {rec.required_skills?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.required_skills.map((skill, i) => (
                        <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-6">
                  <div className="text-center shrink-0">
                    <p className="text-slate-400 text-xs">Match Score</p>
                    <p className="text-3xl font-bold text-emerald-400">{rec.match_percentage || 0}%</p>
                  </div>
                  {rec.missing_skills?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs mb-2">Skills to Acquire</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.missing_skills.map((skill, i) => (
                          <span key={i} className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
