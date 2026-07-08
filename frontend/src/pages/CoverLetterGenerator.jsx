import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Check, Copy, AlertCircle, FileText, Send, Mail } from 'lucide-react';
import { getResumes, generateCoverLetter } from '../services/resumeService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function CoverLetterGenerator() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  // Results
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !jobTitle.trim() || !companyName.trim()) {
      setError('Please fill in resume, job title, and company name.');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setResult(null);
      const response = await generateCoverLetter({
        resume_id: Number(selectedResumeId),
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDesc,
      });
      setResult(extractData(response));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to generate cover letter'));
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'letter') {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  if (loadingResumes) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-650" />
          <p className="text-slate-500 mt-3 text-sm">Loading options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold flex items-center gap-2 text-stone-900">
            <Mail className="w-8 h-8 text-purple-600" />
            AI Outreach & Cover Letter Generator
          </h1>
          <p className="text-stone-600 mt-1">Generate highly tailored cover letters and concise LinkedIn outreach emails in seconds.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-red-650 bg-red-50 p-4 rounded-xl mb-6 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Input Pane */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-5 text-stone-850">Outreach Setup</h2>
              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Resume Profile</label>
                  {resumes.length === 0 ? (
                    <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      No processed resumes found. Upload first.
                    </div>
                  ) : (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-purple-650 text-sm"
                    >
                      {resumes.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Target Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-purple-650 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-purple-650 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Job Description (Keywords)</label>
                  <textarea
                    placeholder="Paste keywords, skills, or specific requirements here..."
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    rows={5}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-purple-650 text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={generating || resumes.length === 0}
                  className="w-full bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm shadow-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating outreach...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-current text-amber-400" />
                      Generate Outreach
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Results Pane */}
          <div className="lg:col-span-2">
            {!result ? (
              <div className="bg-white border border-stone-200 border-dashed rounded-2xl p-12 text-center text-stone-500 h-full flex flex-col items-center justify-center">
                <Mail className="w-12 h-12 text-stone-300 mb-3" />
                <h3 className="text-base font-bold text-stone-700">Outreach Materials Workspace</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm">
                  Complete the setup on the left pane and click generate. Your tailored cover letter and outreach templates will display here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cover Letter Block */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-650" />
                      Tailored Cover Letter
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.cover_letter, 'letter')}
                      className="text-xs bg-[#f8f5ef] border border-stone-200 hover:bg-stone-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition text-stone-700"
                    >
                      {copiedLetter ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Text
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-stone-850 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-[#fbfaf7] p-5 rounded-xl border border-stone-200">
                    {result.cover_letter}
                  </pre>
                </div>

                {/* Recruiter Email Block */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-purple-650" />
                      LinkedIn / Direct Recruiter Outreach Email
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.outreach_email, 'email')}
                      className="text-xs bg-[#f8f5ef] border border-stone-200 hover:bg-stone-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition text-stone-700"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Text
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-stone-850 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-[#fbfaf7] p-5 rounded-xl border border-stone-200">
                    {result.outreach_email}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
