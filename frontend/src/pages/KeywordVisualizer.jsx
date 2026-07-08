import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { getResumes, getKeywordDensity } from '../services/resumeService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function KeywordVisualizer() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true);
        const response = await getResumes();
        const data = extractData(response);
        setResumes(data || []);
        if (data && data.length > 0) {
          setSelectedResumeId(data[0].id);
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load resumes'));
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !jobDescription.trim()) {
      setError('Please select a resume and paste the target job description.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAnalytics(null);
      const response = await getKeywordDensity(selectedResumeId, jobDescription);
      setAnalytics(extractData(response));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to analyze keyword density'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 text-stone-900">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            ATS Keyword Gap & Density Cloud
          </h1>
          <p className="text-stone-600 mt-1">Cross-reference your resume content against target jobs to reveal matching strengths and missing keywords.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-red-650 bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Input Selector and Textarea Form */}
        <div className="bg-white border border-stone-200 rounded-[28px] p-6 md:p-8 shadow-sm">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-bold text-stone-650 uppercase tracking-wider mb-2">Select Resume Profile</label>
                {loadingResumes ? (
                  <div className="h-10 bg-stone-100 rounded-xl animate-pulse" />
                ) : resumes.length === 0 ? (
                  <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No resumes found. Upload a resume to continue.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-purple-600 transition"
                  >
                    {resumes.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.title} ({res.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-650 uppercase tracking-wider mb-2">Analysis Context</label>
                <div className="bg-[#fcfaf6] border border-stone-200 rounded-xl p-3 text-xs text-stone-600 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p>Paste the full text of the job description or role requirements. The AI will extract and map key technical core requirements.</p>
                </div>
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold text-stone-650 uppercase tracking-wider mb-2">Target Job Description</label>
              <textarea
                placeholder="Paste the job posting requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-purple-600 transition resize-y leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || resumes.length === 0}
              className="w-full bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Keyword Cloud...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Analyze Keyword Overlap
                </>
              )}
            </button>
          </form>
        </div>

        {/* Word Tag Clouds Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: Overlapping Matched Cloud */}
            <div className="bg-white border border-stone-200 rounded-[28px] p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900 border-b border-stone-150 pb-3 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Your Matching Keywords
              </h3>

              {analytics.matched_keywords?.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No keyword match overlap identified.</p>
              ) : (
                <div className="flex flex-wrap gap-3 items-center justify-center min-h-[160px] bg-[#fcfaf6] p-6 rounded-2xl border border-stone-200">
                  {analytics.matched_keywords?.map((item, idx) => {
                    const fontSize = Math.min(Math.max(11 + (item.weight * 0.1), 12), 26);
                    return (
                      <span
                        key={idx}
                        style={{ fontSize: `${fontSize}px` }}
                        className="font-bold text-green-700 bg-green-50/50 border border-green-200 px-3 py-1 rounded-full inline-flex items-center gap-1 transition hover:bg-green-50 shadow-sm cursor-default"
                        title={`Match importance weight: ${item.weight}%`}
                      >
                        {item.word}
                        <span className="text-[9px] text-green-400 font-semibold">({item.weight})</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 2: Missing Priority Cloud */}
            <div className="bg-white border border-stone-200 rounded-[28px] p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900 border-b border-stone-150 pb-3 mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Missing Core Gaps
              </h3>

              {analytics.missing_keywords?.length === 0 ? (
                <p className="text-xs text-stone-400 italic">Excellent match! No critical skill gaps identified.</p>
              ) : (
                <div className="flex flex-wrap gap-3 items-center justify-center min-h-[160px] bg-[#fdfcf9] p-6 rounded-2xl border border-stone-200">
                  {analytics.missing_keywords?.map((item, idx) => {
                    const fontSize = Math.min(Math.max(11 + (item.weight * 0.1), 12), 26);
                    return (
                      <span
                        key={idx}
                        style={{ fontSize: `${fontSize}px` }}
                        className="font-bold text-red-700 bg-red-50/40 border border-red-200 px-3 py-1 rounded-full inline-flex items-center gap-1 transition hover:bg-red-50 shadow-sm cursor-default"
                        title={`Missing priority weight: ${item.weight}%`}
                      >
                        {item.word}
                        <span className="text-[9px] text-red-400 font-semibold">({item.weight})</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
