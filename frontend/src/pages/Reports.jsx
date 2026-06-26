import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, FileDown, Loader2, Zap } from 'lucide-react';
import { getAnalysisHistory } from '../services/analysisService';
import { generateReport, getReports } from '../services/reportService';
import { getResumes } from '../services/resumeService';
import { useToast } from '../context/ToastContext';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function Reports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [generating, setGenerating] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reportsResponse, analysesResponse, resumesResponse] = await Promise.all([
        getReports(),
        getAnalysisHistory(),
        getResumes(),
      ]);
      setReports(extractData(reportsResponse) || []);
      setAnalyses(extractData(analysesResponse) || []);
      setResumes(extractData(resumesResponse) || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch reports'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (analysis) => {
    try {
      setGenerating(analysis.id);
      await generateReport({ analysis_id: analysis.id });
      showToast('Report generated successfully!', 'success');
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to generate report'), 'error');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (report) => {
    try {
      setDownloading(report.id);
      const downloadUrl = report.download_url || report.report_url;
      if (!downloadUrl) {
        showToast('Report URL not available', 'error');
        return;
      }
      window.open(downloadUrl, '_blank');
      showToast('Report download started!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to download report'), 'error');
    } finally {
      setDownloading(null);
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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-slate-400 text-sm mb-8">View, generate, and download your analysis reports.</p>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {reports.length > 0 && (
          <div className="space-y-4 mb-10">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold">{report.title || `Report #${report.id}`}</h3>
                  <p className="text-sm text-slate-400">
                    Generated: {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(report)}
                  disabled={downloading === report.id}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-4 py-2 rounded-xl font-semibold text-sm transition cursor-pointer"
                >
                  {downloading === report.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloading === report.id ? 'Downloading...' : 'Download'}
                </button>
              </div>
            ))}
          </div>
        )}

        {analyses.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Generate Reports From Analyses</h2>
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      {analysis.resume?.title || `Analysis #${analysis.id}`}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {analysis.job_role?.title || 'Unknown role'} · ATS Score: {analysis.ats_score ?? 0}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerate(analysis)}
                    disabled={generating === analysis.id}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 px-4 py-2 rounded-xl font-semibold text-sm transition cursor-pointer"
                  >
                    {generating === analysis.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileDown className="w-5 h-5" />
                    )}
                    {generating === analysis.id ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : resumes.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Analyze Uploaded Resumes First</h2>
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{resume.title}</h3>
                    <p className="text-sm text-slate-400">
                      Status: {resume.status} · Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/analyze/${resume.id}`)}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl font-semibold text-sm transition cursor-pointer"
                  >
                    <Zap className="w-5 h-5" />
                    Analyze Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-400">No resumes found yet. Upload a resume first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
