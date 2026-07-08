import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Edit, Save, X, Briefcase, AlertCircle } from 'lucide-react';
import { getJobApplications, createJobApplication, updateJobApplication, deleteJobApplication } from '../services/jobService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

const STAGES = {
  BOOKMARKED: { label: 'Bookmarked', color: 'border-t-sky-500 bg-sky-50 text-sky-750 text-sky-800' },
  APPLIED: { label: 'Applied', color: 'border-t-indigo-500 bg-indigo-50 text-indigo-750 text-indigo-800' },
  INTERVIEWING: { label: 'Interviewing', color: 'border-t-amber-500 bg-amber-50 text-amber-750 text-amber-800' },
  OFFER: { label: 'Offer Received', color: 'border-t-green-500 bg-green-50 text-green-750 text-green-800' },
  REJECTED: { label: 'Rejected', color: 'border-t-rose-500 bg-rose-50 text-rose-750 text-rose-800' },
};

export default function JobTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState('BOOKMARKED');
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStage, setEditStage] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getJobApplications();
      setApplications(extractData(response) || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch job applications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !companyName.trim()) return;

    try {
      setSaving(true);
      setError('');
      const response = await createJobApplication({
        job_title: jobTitle,
        company_name: companyName,
        stage: selectedStage,
        notes,
      });
      setApplications(prev => [extractData(response), ...prev]);
      setJobTitle('');
      setCompanyName('');
      setNotes('');
      setSelectedStage('BOOKMARKED');
      setShowAddForm(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to log job application'));
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (appId, nextStage) => {
    try {
      setError('');
      await updateJobApplication(appId, { stage: nextStage });
      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, stage: nextStage } : app))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update application stage'));
    }
  };

  const handleSaveEdit = async (appId) => {
    try {
      setUpdating(true);
      setError('');
      await updateJobApplication(appId, { notes: editNotes, stage: editStage });
      setApplications(prev =>
        prev.map(app =>
          app.id === appId ? { ...app, notes: editNotes, stage: editStage } : app
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update details'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (appId) => {
    if (!confirm('Are you sure you want to delete this application log?')) return;

    try {
      setError('');
      await deleteJobApplication(appId);
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete log entry'));
    }
  };

  const startEditing = (app) => {
    setEditingId(app.id);
    setEditNotes(app.notes || '');
    setEditStage(app.stage);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-650" />
          <p className="text-slate-500 mt-3 text-sm">Loading your pipelines...</p>
        </div>
      </div>
    );
  }

  // Group applications by stage
  const grouped = Object.keys(STAGES).reduce((acc, stage) => {
    acc[stage] = applications.filter(app => app.stage === stage);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page title and button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2 text-stone-900">
              <Briefcase className="w-8 h-8 text-purple-600" />
              Job Application Pipeline Tracker
            </h1>
            <p className="text-stone-600 mt-1">Track interview processes, offers, and milestones in a visual Kanban board.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 bg-stone-950 hover:bg-stone-850 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer shadow-sm"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Close Workspace' : 'Log New Application'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-red-650 bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Dynamic add form */}
        {showAddForm && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm max-w-2xl animate-fade-in">
            <h2 className="text-lg font-bold mb-4 text-stone-850">New Job Log</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. OpenAI"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Initial Stage</label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none"
                  >
                    {Object.entries(STAGES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Workspace Notes</label>
                  <input
                    type="text"
                    placeholder="Add interview scheduling details, contact links, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  {saving ? 'Creating Log...' : 'Save Job Log'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kanban Board columns layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.entries(STAGES).map(([stageKey, stageConfig]) => {
            const list = grouped[stageKey] || [];
            return (
              <div key={stageKey} className="flex flex-col bg-stone-50 border border-stone-200 rounded-2xl p-4 min-h-[450px]">
                {/* Column header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    {stageConfig.label}
                  </span>
                  <span className="bg-stone-200/60 text-stone-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {list.length}
                  </span>
                </div>

                {/* Job Cards list */}
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                      Empty column
                    </div>
                  ) : (
                    list.map((app) => (
                      <div
                        key={app.id}
                        className={`bg-white border border-stone-200 border-t-3 rounded-xl p-4 shadow-sm hover:shadow-md transition relative group ${stageConfig.color}`}
                      >
                        {editingId === app.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-stone-500 block mb-1">Stage</label>
                              <select
                                value={editStage}
                                onChange={(e) => setEditStage(e.target.value)}
                                className="w-full bg-[#fdfcf9] border border-stone-250 rounded px-2 py-1 text-xs text-stone-900 focus:outline-none"
                              >
                                {Object.entries(STAGES).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-stone-500 block mb-1">Notes</label>
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                rows={2}
                                className="w-full bg-[#fdfcf9] border border-stone-250 rounded px-2 py-1 text-xs text-stone-900 focus:outline-none resize-none"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSaveEdit(app.id)}
                                disabled={updating}
                                className="p-1 rounded bg-stone-950 text-white hover:bg-stone-850 transition"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="text-sm font-bold text-stone-900 leading-snug">{app.job_title}</h4>
                                <p className="text-xs text-stone-500">{app.company_name}</p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <button
                                  onClick={() => startEditing(app)}
                                  className="p-1 rounded bg-stone-50 hover:bg-stone-200 text-stone-500 transition cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(app.id)}
                                  className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {app.notes && (
                              <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded border border-stone-150 leading-relaxed font-sans">
                                {app.notes}
                              </p>
                            )}

                            {/* Quick move stage toggle */}
                            <div className="pt-2 border-t border-stone-150 flex items-center justify-between text-[10px] text-stone-400">
                              <span>Move stage</span>
                              <select
                                value={app.stage}
                                onChange={(e) => handleStageChange(app.id, e.target.value)}
                                className="bg-[#fcfaf6] border border-stone-200 rounded px-1 text-stone-600 text-[10px]"
                              >
                                {Object.entries(STAGES).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
