import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Briefcase, FileDown, HelpCircle, Loader2 } from 'lucide-react';
import { getAnalysisById } from '../services/analysisService';
import { generateReport } from '../services/reportService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';
import { useToast } from '../context/ToastContext';

export default function AnalysisReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await getAnalysisById(id);
        setAnalysis(extractData(response));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch analysis'));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const handleGenerateReport = async () => {
    if (!analysis?.id) {
      const message = 'Please analyze resume before generating report.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateReport({ analysis_id: Number(analysis.id) });
      setReport(extractData(response));
      showToast('Report generated successfully!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to generate report'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (report?.download_url) {
      window.open(report.download_url, '_blank');
      return;
    }

    if (report?.id) {
      window.open(`/api/reports/${report.id}/download/`, '_blank');
      return;
    }

    showToast('Please generate report before downloading.', 'error');
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

        {analysis && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Analysis Report</h1>
                <p className="text-slate-400 text-sm mt-1">
                  {analysis.resume?.title} · {analysis.job_role?.title}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => navigate('/jobs', { state: { resumeId: analysis.resume?.id } })}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Recommendations
                </button>
                <button
                  onClick={() => navigate(`/interview/${analysis.resume?.id}`, { state: { jobRoleId: analysis.job_role?.id } })}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Interview
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
                {report?.download_url && (
                  <button
                    onClick={handleDownloadReport}
                    className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Report
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'ATS Score', value: analysis.ats_score, color: 'text-purple-400' },
                { label: 'Skills Score', value: analysis.skills_score, color: 'text-emerald-400' },
                { label: 'Keywords Score', value: analysis.keywords_score, color: 'text-blue-400' },
                { label: 'Job Match', value: analysis.job_match_percentage, color: 'text-amber-400' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value ?? 0}%</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Projects', value: analysis.projects_score },
                { label: 'Experience', value: analysis.experience_score },
                { label: 'Education', value: analysis.education_score },
                { label: 'Formatting', value: analysis.formatting_score },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className="text-xl font-bold text-slate-100">{item.value ?? 0}%</p>
                </div>
              ))}
            </div>

            {analysis.matched_skills?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Matched Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.matched_skills.map((skill, idx) => (
                    <span key={idx} className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.missing_skills?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Missing Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills.map((skill, idx) => (
                    <span key={idx} className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Resume Suggestions</h2>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
