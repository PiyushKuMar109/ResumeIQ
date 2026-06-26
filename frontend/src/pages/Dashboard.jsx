import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Briefcase,
  CheckCircle2,
  FileBarChart,
  FileText,
  HelpCircle,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSummary } from '../services/dashboardService';
import { extractData, getErrorMessage, getUserDisplayName } from '../utils/apiHelpers';

const quickActions = [
  {
    label: 'Upload Resume',
    description: 'Start a new analysis flow with PDF or DOCX upload.',
    icon: Upload,
    path: '/upload-resume',
    accent: 'from-amber-100 via-white to-rose-50',
    iconColor: 'text-amber-700',
  },
  {
    label: 'My Resumes',
    description: 'Review parsed resumes, extracted text, and status.',
    icon: FileText,
    path: '/resumes',
    accent: 'from-sky-100 via-white to-cyan-50',
    iconColor: 'text-sky-700',
  },
  {
    label: 'Job Matches',
    description: 'See which roles align with your current skill set.',
    icon: Briefcase,
    path: '/jobs',
    accent: 'from-emerald-100 via-white to-teal-50',
    iconColor: 'text-emerald-700',
  },
  {
    label: 'Reports',
    description: 'Open generated reports and export polished summaries.',
    icon: FileBarChart,
    path: '/reports',
    accent: 'from-violet-100 via-white to-fuchsia-50',
    iconColor: 'text-violet-700',
  },
];

const workflowSteps = [
  'Upload resume',
  'Select target role',
  'Review ATS score',
  'Generate interview prep',
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await getSummary();
        setSummary(extractData(response));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load dashboard summary'));
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const stats = [
    {
      label: 'Resumes',
      value: summary?.total_resumes ?? 0,
      subtitle: 'Files ready for analysis',
      icon: FileText,
      tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    {
      label: 'Analyses',
      value: summary?.total_analyses ?? 0,
      subtitle: 'Completed ATS reviews',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    {
      label: 'Average Score',
      value: `${summary?.average_ats_score ?? 0}%`,
      subtitle: 'Across all resume checks',
      icon: Award,
      tone: 'bg-violet-50 text-violet-700 ring-violet-200',
    },
    {
      label: 'Best Score',
      value: `${summary?.best_score ?? 0}%`,
      subtitle: 'Strongest performance so far',
      icon: Sparkles,
      tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#f3efe7] p-6 md:p-8">
        <div className="flex min-h-[400px] items-center justify-center rounded-[32px] border border-black/5 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-stone-700" />
            <p className="mt-3 text-sm text-stone-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#f3efe7] p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_30%),radial-gradient(circle_at_70%_20%,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(135deg,_#fffdf8,_#ffffff_45%,_#fff7ed)]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Career Workspace
                </span>
                <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-stone-900 md:text-5xl">
                  Welcome back, {getUserDisplayName(user).split(' ')[0]}.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                  Keep the resume workflow moving from upload to ATS scoring, role targeting,
                  interview preparation, and final reporting without losing context.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/upload-resume')}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 cursor-pointer"
                  >
                    Upload Resume
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/resumes')}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 cursor-pointer"
                  >
                    Browse Resumes
                  </button>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {workflowSteps.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-2xl border border-stone-200/80 bg-white/80 p-4 backdrop-blur"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                        Step {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-stone-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-200 bg-[#fcfaf6] p-6 md:p-8 xl:border-t-0 xl:border-l">
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
                  Current Snapshot
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Latest Resume</p>
                    <p className="mt-2 text-lg font-semibold">
                      {summary?.latest_resume?.title || 'No resume uploaded yet'}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {summary?.latest_resume?.status || 'Upload a resume to begin the full flow'}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      onClick={() => navigate('/profile')}
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:bg-stone-50 cursor-pointer"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Profile</p>
                        <p className="mt-1 text-sm font-semibold text-stone-800">{user?.email}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-stone-400" />
                    </button>

                    <button
                      onClick={() =>
                        summary?.latest_resume
                          ? navigate(`/interview/${summary.latest_resume.id}`)
                          : navigate('/upload-resume')
                      }
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:bg-stone-50 cursor-pointer"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Interview Prep</p>
                        <p className="mt-1 text-sm font-semibold text-stone-800">
                          Generate role-specific questions
                        </p>
                      </div>
                      <HelpCircle className="h-4 w-4 text-stone-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.path}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => navigate(action.path)}
              className={`group rounded-[28px] border border-black/5 bg-gradient-to-br ${action.accent} p-5 text-left shadow-[0_16px_45px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)] cursor-pointer`}
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-2xl bg-white p-3 shadow-sm ${action.iconColor}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-stone-400 transition group-hover:text-stone-800" />
              </div>
              <h2 className="mt-5 text-lg font-bold tracking-[-0.02em] text-stone-900">
                {action.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{action.description}</p>
            </motion.button>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-stone-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">{stat.subtitle}</p>
                </div>
                <div className={`rounded-2xl p-3 ring-1 ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
                  Recent Analyses
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-stone-900">
                  Latest ATS results
                </h3>
              </div>
              <button
                onClick={() => navigate('/resumes')}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 cursor-pointer"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {summary?.recent_analyses?.length > 0 ? (
              <div className="mt-6 space-y-3">
                {summary.recent_analyses.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/analysis/${item.id}`)}
                    className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-stone-200 bg-[#fcfaf6] px-5 py-4 text-left transition hover:border-stone-300 hover:bg-stone-50 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-stone-900">
                        {item.resume_title}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">{item.job_role}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-black tracking-[-0.03em] text-stone-900">
                        {item.ats_score}%
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-stone-300 bg-[#fcfaf6] px-6 text-center">
                <AlertTriangle className="h-9 w-9 text-stone-400" />
                <h4 className="mt-4 text-lg font-bold text-stone-800">No analyses yet</h4>
                <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                  Upload your first resume and move directly into role-based ATS analysis.
                </p>
                <button
                  onClick={() => navigate('/upload-resume')}
                  className="mt-5 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 cursor-pointer"
                >
                  Upload First Resume
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] md:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
                Launch Pad
              </p>
              <div className="mt-5 space-y-3">
                {[
                  {
                    label: 'Upload Resume',
                    icon: Upload,
                    path: '/upload-resume',
                    tone: 'text-amber-700 bg-amber-50',
                  },
                  {
                    label: 'Job Recommendations',
                    icon: Briefcase,
                    path: '/jobs',
                    tone: 'text-emerald-700 bg-emerald-50',
                  },
                  {
                    label: 'Reports',
                    icon: FileBarChart,
                    path: '/reports',
                    tone: 'text-violet-700 bg-violet-50',
                  },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 px-4 py-3 transition hover:bg-stone-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${item.tone}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-stone-800">{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-[#fff8ee] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)] md:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
                Account
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Email</p>
                  <p className="mt-1 break-all text-sm font-semibold text-stone-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Role</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-stone-900">{user?.role}</p>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 cursor-pointer"
                >
                  Edit Profile
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
