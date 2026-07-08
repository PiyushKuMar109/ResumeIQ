import React, { useState, useEffect } from 'react';
import { Loader2, Compass, Award, Star, TrendingUp, AlertCircle, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { getResumes, getCareerRoadmap } from '../services/resumeService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function CareerRoadmap() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roadmap, setRoadmap] = useState(null);

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
    if (!selectedResumeId) {
      setError('Please select a resume profile.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRoadmap(null);
      const response = await getCareerRoadmap(selectedResumeId);
      setRoadmap(extractData(response));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to plan career roadmap'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Title Block */}
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 text-stone-900">
            <Compass className="w-8 h-8 text-purple-600 animate-spin-slow" />
            AI Career Path & Growth Roadmap
          </h1>
          <p className="text-stone-600 mt-1">Map your 5-year career milestone projections, skill trees, and certifications based on your profile.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Setup Selector */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-650 uppercase tracking-wider mb-2">Select Resume Profile</label>
              {loadingResumes ? (
                <div className="h-10 bg-stone-100 rounded-xl animate-pulse" />
              ) : resumes.length === 0 ? (
                <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  Please upload a resume first.
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-purple-600 transition"
                >
                  {resumes.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.title} ({res.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || resumes.length === 0}
              className="bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Growth Path...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  Generate Roadmap
                </>
              )}
            </button>
          </form>
        </div>

        {/* Roadmap Display */}
        {roadmap && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Milestones Timeline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-stone-200 rounded-[28px] p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-150 pb-3 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  5-Year Milestone Timeline
                </h3>

                <div className="relative pl-6 border-l-2 border-stone-200 space-y-8 ml-2">
                  {roadmap.milestones?.map((milestone, idx) => (
                    <div key={idx} className="relative group">
                      
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 border-purple-600 bg-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      </span>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-150">
                          {milestone.period}
                        </span>
                        <h4 className="text-stone-900 font-extrabold text-base mt-2">
                          {milestone.title}
                        </h4>
                        <p className="text-stone-600 text-xs mt-1.5 leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Curve projection block */}
              {roadmap.salary_projection && (
                <div className="bg-white border border-stone-200 rounded-[28px] p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Salary Projection Trend
                  </h3>
                  <div className="grid grid-cols-4 gap-4 bg-[#fcfaf6] p-4 rounded-xl border border-stone-200 text-center">
                    {roadmap.salary_projection.map((sal, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-[10px] text-stone-400 font-bold uppercase">{sal.label}</p>
                        <p className="text-lg font-black text-stone-900">{sal.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Skills Acquisition & Certifications */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Skill acquisition tree */}
              <div className="bg-white border border-stone-200 rounded-[28px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-150 pb-3 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Target Skill Tree
                </h3>

                <div className="space-y-4">
                  {roadmap.skills_tree?.map((tree, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">{tree.category}</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          tree.status === 'Mastered' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {tree.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tree.skills?.map((sk, sidx) => (
                          <span key={sidx} className="text-xs px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 flex items-center gap-1">
                            {tree.status === 'Mastered' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                            )}
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications Card */}
              <div className="bg-white border border-stone-200 rounded-[28px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 border-b border-stone-150 pb-3 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Recommended Certifications
                </h3>

                <div className="space-y-3">
                  {roadmap.certifications?.map((cert, idx) => (
                    <div key={idx} className="bg-[#fcfaf6] border border-stone-200 rounded-xl p-4 space-y-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-600" />
                      <h4 className="text-stone-900 font-extrabold text-sm flex items-center justify-between">
                        {cert.name}
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">{cert.provider}</p>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{cert.benefit}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
