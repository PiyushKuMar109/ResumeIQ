import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Check, Copy, ChevronDown, ChevronUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { getResumeById, tailorResume } from '../services/resumeService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function TailorResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form input
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // Accordion UI state
  const [expandedExp, setExpandedExp] = useState({});
  const [expandedProj, setExpandedProj] = useState({});

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoadingResume(true);
        const response = await getResumeById(id);
        setResume(extractData(response));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load resume details'));
      } finally {
        setLoadingResume(false);
      }
    };
    fetchResume();
  }, [id]);

  const handleTailor = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please provide both Job Title and Job Description.');
      return;
    }
    
    try {
      setTailoring(true);
      setError('');
      setSuccessMsg('');
      const response = await tailorResume(id, {
        job_title: jobTitle,
        job_description: jobDescription,
      });
      const data = extractData(response);
      setTailoredResult(data);
      setSuccessMsg('Resume tailored successfully!');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to tailor resume'));
    } finally {
      setTailoring(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  };

  const toggleExp = (index) => {
    setExpandedExp(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleProj = (index) => {
    setExpandedProj(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loadingResume) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          <p className="text-slate-400 mt-3 text-sm">Loading resume details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(`/resumes/${id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Resume Details
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              AI Resume Tailor & Optimizer
            </h1>
            <p className="text-slate-400 mt-1">Optimize and align your resume for your target job description</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300">
            Current Resume: <span className="font-semibold text-white">{resume?.title}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl mb-6 border border-red-500/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 text-green-400 bg-green-500/10 p-4 rounded-xl mb-6 border border-green-500/20">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{successMsg}</p>
          </div>
        )}

        {/* Form Container */}
        {!tailoredResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-300">
              Step 1: Enter Target Job Details
            </h2>
            <form onSubmit={handleTailor} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior React Developer, Python Backend Engineer..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Job Description</label>
                <textarea
                  placeholder="Paste the full job description or requirements list here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={tailoring}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-600/10"
              >
                {tailoring ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI is Tailoring Your Resume (may take ~10-15s)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Tailored Recommendations
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tailored Results Display */}
        {tailoredResult && (
          <div className="space-y-8 animate-fade-in">
            {/* Header metrics card */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Enhancement Complete
                </div>
                <h2 className="text-2xl font-bold text-white">{tailoredResult.job_title}</h2>
                <p className="text-slate-400 text-sm max-w-xl">
                  We've rewrote your descriptions to showcase key technologies requested in the target job specifications.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(30, 41, 59, 1)" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#a855f7"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * tailoredResult.match_score) / 100}
                    />
                  </svg>
                  <span className="absolute text-xl font-extrabold text-white">{tailoredResult.match_score}%</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Match Score</h4>
                  <p className="text-xs text-slate-400">ATS Alignment Metric</p>
                </div>
              </div>
            </div>

            {/* Main enhancement split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Overall Tips & Skills */}
              <div className="space-y-8 lg:col-span-1">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Key Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {tailoredResult.suggestions.map((tip, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950 border border-slate-900 p-3 rounded-xl">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Tailored Core Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tailoredResult.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-950 text-purple-300 border border-slate-800 text-xs px-3 py-1.5 rounded-xl font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setTailoredResult(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                >
                  Tailor for a Different Job
                </button>
              </div>

              {/* Right Column: Comparative Sections */}
              <div className="space-y-8 lg:col-span-2">
                {/* Summary Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">1. Professional Summary</h3>
                    <button
                      onClick={() => copyToClipboard(tailoredResult.summary, 'Summary')}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Suggestion
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {tailoredResult.summary}
                  </div>
                </div>

                {/* Work Experience Comparison */}
                {tailoredResult.experience && tailoredResult.experience.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-bold text-white mb-6">2. Work Experience Enhancements</h3>
                    <div className="space-y-4">
                      {tailoredResult.experience.map((item, idx) => (
                        <div key={idx} className="border border-slate-850 rounded-xl bg-slate-950 overflow-hidden">
                          <button
                            onClick={() => toggleExp(idx)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition cursor-pointer"
                          >
                            <span className="text-sm font-semibold text-slate-200">
                              Experience Item #{idx + 1}
                            </span>
                            {expandedExp[idx] ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {expandedExp[idx] && (
                            <div className="p-4 border-t border-slate-850 space-y-4 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-bold text-slate-400">Original</h4>
                                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-400 whitespace-pre-wrap">
                                    {item.original}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-bold text-purple-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    AI Suggested Rewrite
                                  </h4>
                                  <div className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-lg text-slate-200 whitespace-pre-wrap">
                                    {item.tailored}
                                  </div>
                                </div>
                              </div>
                              {item.reason && (
                                <div className="bg-slate-900/60 p-3 rounded-lg text-slate-300">
                                  <strong className="text-purple-400">Recruiter Rationale: </strong>
                                  {item.reason}
                                </div>
                              )}
                              <div className="flex justify-end">
                                <button
                                  onClick={() => copyToClipboard(item.tailored, 'Experience description')}
                                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy Rewrite
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects Comparison */}
                {tailoredResult.projects && tailoredResult.projects.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-bold text-white mb-6">3. Project Enhancements</h3>
                    <div className="space-y-4">
                      {tailoredResult.projects.map((item, idx) => (
                        <div key={idx} className="border border-slate-850 rounded-xl bg-slate-950 overflow-hidden">
                          <button
                            onClick={() => toggleProj(idx)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition cursor-pointer"
                          >
                            <span className="text-sm font-semibold text-slate-200">
                              Project Item #{idx + 1}
                            </span>
                            {expandedProj[idx] ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {expandedProj[idx] && (
                            <div className="p-4 border-t border-slate-850 space-y-4 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-bold text-slate-400">Original</h4>
                                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-400 whitespace-pre-wrap">
                                    {item.original}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-bold text-purple-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    AI Suggested Rewrite
                                  </h4>
                                  <div className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-lg text-slate-200 whitespace-pre-wrap">
                                    {item.tailored}
                                  </div>
                                </div>
                              </div>
                              {item.reason && (
                                <div className="bg-slate-900/60 p-3 rounded-lg text-slate-300">
                                  <strong className="text-purple-400">Recruiter Rationale: </strong>
                                  {item.reason}
                                </div>
                              )}
                              <div className="flex justify-end">
                                <button
                                  onClick={() => copyToClipboard(item.tailored, 'Project description')}
                                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy Rewrite
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
