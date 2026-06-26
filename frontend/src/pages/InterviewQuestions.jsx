import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { generateQuestions, getInterviewsByResume } from '../services/interviewService';
import { getJobRoles } from '../services/jobService';
import { useToast } from '../context/ToastContext';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

const QUESTION_GROUPS = {
  TECHNICAL: 'Technical Questions',
  HR: 'HR Questions',
  PROJECT: 'Project Questions',
  CODING: 'Coding Questions',
};

export default function InterviewQuestions() {
  const { resumeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [questionsRes, rolesRes] = await Promise.all([
          getInterviewsByResume(resumeId),
          getJobRoles(),
        ]);
        setQuestions(extractData(questionsRes) || []);
        setJobRoles(extractData(rolesRes) || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch questions'));
      } finally {
        setLoading(false);
      }
    };

    if (resumeId) {
      fetchData();
    }
  }, [resumeId]);

  useEffect(() => {
    const presetJobRoleId = location.state?.jobRoleId;
    if (presetJobRoleId) {
      setSelectedJobRole(String(presetJobRoleId));
    }
  }, [location.state]);

  const handleGenerate = async () => {
    if (!selectedJobRole) {
      showToast('Please select a job role', 'error');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await generateQuestions({
        resume_id: Number(resumeId),
        job_role_id: Number(selectedJobRole),
        difficulty,
      });
      const newQuestions = extractData(response) || [];
      setQuestions(Array.isArray(newQuestions) ? newQuestions : [newQuestions]);
      showToast('Interview questions generated!', 'success');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to generate questions');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    const type = q.question_type || 'TECHNICAL';
    if (!acc[type]) acc[type] = [];
    acc[type].push(q);
    return acc;
  }, {});

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
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Resumes
        </button>

        <h1 className="text-3xl font-bold mb-2">Interview Questions</h1>
        <p className="text-slate-400 text-sm mb-8">Generate AI-powered interview questions for your resume.</p>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Role</label>
              <select
                value={selectedJobRole}
                onChange={(e) => setSelectedJobRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500"
              >
                <option value="">Choose a job role...</option>
                {jobRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Interview Questions'
            )}
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No questions yet. Select a job role and generate questions above.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(QUESTION_GROUPS).map(([type, label]) => {
              const items = groupedQuestions[type];
              if (!items?.length) return null;
              return (
                <div key={type}>
                  <h2 className="text-lg font-bold text-purple-400 mb-4">{label}</h2>
                  <div className="space-y-4">
                    {items.map((q, idx) => (
                      <div key={q.id || idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                            {q.difficulty || difficulty}
                          </span>
                        </div>
                        <p className="text-slate-200 mb-3">{q.question}</p>
                        {q.answer_hint && (
                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500 mb-1">Answer Hint</p>
                            <p className="text-sm text-slate-300">{q.answer_hint}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
