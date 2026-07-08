import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, AlertCircle, Play, ArrowRight, Star, Award, Video, VideoOff, Terminal, Code, Cpu, Clock, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { getResumes } from '../services/resumeService';
import { startMockSession, submitMockAnswer } from '../services/interviewService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';
import { useNavigate } from 'react-router-dom';

// Audio chime synthesizer using Web Audio API
const playChime = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'join') {
      // Ascending chime: C4 -> E4 -> G4
      const notes = [261.63, 329.63, 392.00];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.15 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.45);
      });
    } else if (type === 'hangup') {
      // Descending chime: G4 -> E4 -> C4
      const notes = [392.00, 329.63, 261.63];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    } else if (type === 'notify') {
      // High-pitched soft ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.00, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (err) {
    console.warn("Web Audio context failed to play:", err);
  }
};

export default function MockInterview() {
  const navigate = useNavigate();
  // State for setup
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // State for active session
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [error, setError] = useState('');

  // Active inputs
  const [verbalAnswer, setVerbalAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('def solution():\n    # Write your code here\n    pass');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [workspaceTab, setWorkspaceTab] = useState('verbal'); // 'verbal' or 'code'

  // Evaluation & submissions
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Mic and Speech state
  const [micMuted, setMicMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

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

  // Timer effect
  useEffect(() => {
    if (session && session.status !== 'COMPLETED') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [session]);

  // Camera stream effect
  useEffect(() => {
    if (cameraActive && session && session.status !== 'COMPLETED') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive, session]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(true);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !jobTitle.trim()) {
      setError('Please select a resume and enter a target job title.');
      return;
    }
    
    try {
      setStarting(true);
      setError('');
      setElapsedSeconds(0);
      const response = await startMockSession({
        resume_id: selectedResumeId,
        job_title: jobTitle,
      });
      const data = extractData(response);
      setSession(data);
      setCurrentIdx(0);
      setCompletedAnswers([]);
      setEvaluation(null);
      setVerbalAnswer('');
      setCodeAnswer('// Write your code solution here');
      
      // Auto chimes & Camera startup
      playChime('join');
      setCameraActive(true); 
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start interview session'));
    } finally {
      setStarting(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    
    rec.onstart = () => {
      setIsRecording(true);
      setMicMuted(false); // Unmute when recording
    };
    
    rec.onresult = (event) => {
      let finalTrans = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTrans) {
        setVerbalAnswer(prev => prev + finalTrans);
      }
    };
    
    rec.onerror = (e) => {
      console.error(e);
      stopSpeechRecognition();
    };
    
    rec.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    let combinedAnswer = '';
    if (workspaceTab === 'code') {
      combinedAnswer = `[Language: ${selectedLanguage}]\n\n// Code Workspace:\n${codeAnswer}\n\n// Explanation:\n${verbalAnswer}`;
    } else {
      combinedAnswer = verbalAnswer;
    }

    if (!combinedAnswer.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }
    
    const currentQuestion = session.qa_pairs[currentIdx];
    
    try {
      setSubmitting(true);
      setError('');
      stopSpeechRecognition(); // Stop recording upon submission
      
      const response = await submitMockAnswer(session.id, {
        qa_id: currentQuestion.id,
        user_answer: combinedAnswer,
      });
      const data = extractData(response);
      setEvaluation(data);
      playChime('notify');
      
      // Add to completed list
      setCompletedAnswers(prev => [...prev, {
        ...currentQuestion,
        user_answer: combinedAnswer,
        score: data.score,
        feedback: data.feedback,
        model_answer: data.model_answer,
      }]);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to evaluate answer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setVerbalAnswer('');
    setCodeAnswer('// Write your code solution here');
    setEvaluation(null);
    if (currentIdx + 1 < session.qa_pairs.length) {
      setCurrentIdx(prev => prev + 1);
      const nextQ = session.qa_pairs[currentIdx + 1];
      if (nextQ.question_type === 'CODING' || nextQ.question_type === 'TECHNICAL') {
        setWorkspaceTab('code');
      } else {
        setWorkspaceTab('verbal');
      }
    } else {
      setSession(prev => ({ ...prev, status: 'COMPLETED' }));
      stopCamera();
      playChime('hangup');
    }
  };

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getAverageScore = () => {
    if (completedAnswers.length === 0) return 0;
    const total = completedAnswers.reduce((sum, item) => sum + item.score, 0);
    return Math.round(total / completedAnswers.length);
  };

  if (loadingResumes) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-650" />
          <p className="text-slate-500 mt-3 text-sm">Loading interview settings...</p>
        </div>
      </div>
    );
  }

  // Render Setup Page
  if (!session) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold flex items-center gap-2 text-stone-900">
              <Award className="w-8 h-8 text-purple-600 animate-pulse" />
              AI Mock Interview Simulator
            </h1>
            <p className="text-stone-600 mt-1">Experience a real-time technical video interview complete with coding space and AI grading.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-650 bg-red-50 p-4 rounded-xl mb-6 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-stone-850">Set Up Your Real-Time Interview</h2>
            <form onSubmit={handleStartSession} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Select Resume Profile</label>
                {resumes.length === 0 ? (
                  <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                    No processed resumes found. Please upload a resume first.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-purple-600 transition"
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
                <label className="block text-sm font-semibold text-stone-700 mb-2">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer, Full Stack Python Developer..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-purple-600 transition"
                  required
                />
              </div>

              <div className="bg-[#fcfaf6] border border-stone-200 rounded-xl p-4 flex items-start gap-3">
                <Video className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Device Requirements</h4>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                    This interview uses your camera to simulate a live corporate panel interview. Grant access when prompted by the browser.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={starting || resumes.length === 0}
                className="w-full bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Live Interview...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Enter Simulation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render Session Completed summary page
  if (session.status === 'COMPLETED') {
    const avgScore = getAverageScore();
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-1.5 rounded-full text-sm font-semibold text-green-700">
              <Check className="w-4 h-4" />
              Interview Completed
            </div>
            <h1 className="text-4xl font-extrabold text-stone-900">Performance Summary</h1>
            <p className="text-stone-600">Target Role: <span className="font-semibold text-stone-900">{session.job_title}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Overall Score</span>
              <span className={`text-4xl font-extrabold px-4 py-2 rounded-xl border ${getScoreColorClass(avgScore)}`}>
                {avgScore}%
              </span>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Questions Answered</span>
              <span className="text-4xl font-extrabold text-stone-800">
                {completedAnswers.length} / {session.qa_pairs.length}
              </span>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Interactive Duration</span>
              <span className="text-4xl font-extrabold text-purple-600">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Section results mapping */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-stone-850">Question-by-Question Evaluation</h2>
            {completedAnswers.map((item, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-150 pb-4">
                  <div className="space-y-1">
                    <span className="inline-block bg-[#f8f5ef] text-stone-700 border border-stone-200 text-xs px-2.5 py-1 rounded-md font-semibold">
                      {item.question_type}
                    </span>
                    <h3 className="text-md font-bold text-stone-900">Question #{idx + 1}</h3>
                  </div>
                  <div className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-xl text-sm font-bold ${getScoreColorClass(item.score)}`}>
                    Score: {item.score}%
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Question</h4>
                  <p className="text-sm text-stone-900 font-bold leading-relaxed">{item.question_text}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Your Answer</h4>
                  <p className="text-sm text-stone-800 bg-[#fbfaf7] p-4 rounded-xl border border-stone-200 leading-relaxed whitespace-pre-wrap font-mono">
                    {item.user_answer}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">AI Evaluation & Feedback</h4>
                  <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-xl text-stone-850 text-sm leading-relaxed whitespace-pre-wrap">
                    {item.feedback}
                  </div>
                </div>

                {item.model_answer && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Recommended Model Answer</h4>
                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-stone-750 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.model_answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/30 rounded-2xl p-8 text-white text-center shadow-lg max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Want a live review from a human expert?</h2>
              <p className="text-purple-200 text-sm max-w-lg mx-auto">
                Schedule a 45-minute peer-to-peer session with an experienced interviewer in your target category. Get real-time feedback on your code and verbal explanations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/book-interviewer')}
                className="bg-white hover:bg-stone-100 text-purple-950 font-bold py-3 px-6 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5 text-purple-700" />
                Book P2P Interview
              </button>
              <button
                onClick={() => setSession(null)}
                className="bg-purple-950/40 hover:bg-purple-950/60 border border-purple-400/30 text-white font-bold py-3 px-6 rounded-xl transition cursor-pointer"
              >
                Try AI Mock Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Active Question in boardroom
  const activeQuestion = session.qa_pairs[currentIdx];
  return (
    <div className="p-4 md:p-8 bg-stone-950 min-h-[calc(100vh-5rem)] text-white rounded-[24px]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Conference Room Header Bar */}
        <div className="flex flex-wrap items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-2xl gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Real-Time Board Simulation
              </h2>
              <p className="text-[10px] text-stone-400">Target: {session.job_title} | Meeting ID: meet.ai-interview.com/rsm-board</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-stone-300">
            <div className="bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>DUR: {formatTime(elapsedSeconds)}</span>
            </div>
            <div className="bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-stone-400" />
              <span>ROUND: {currentIdx + 1} / {session.qa_pairs.length}</span>
            </div>
          </div>
        </div>

        {/* Video feeds splitting layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Zoom-style call windows */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Interviewer Pane (Sophia) */}
              <div className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden aspect-video flex flex-col justify-between p-4 relative group shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="bg-stone-950/80 text-[10px] border border-stone-800 px-2 py-0.5 rounded font-semibold text-stone-300">
                    Host - Representative
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>

                <div className="my-auto text-center space-y-3">
                  <div className="w-16 h-16 bg-purple-900 border border-purple-500/30 rounded-full mx-auto flex items-center justify-center shadow-inner relative">
                    <Cpu className="w-8 h-8 text-purple-300" />
                    {submitting && (
                      <span className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Sophia (AI Panel Lead)</h4>
                    <p className="text-[11px] text-stone-400">Hiring Representative</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    Sophia is {submitting ? 'evaluating...' : evaluation ? 'waiting' : 'listening...'}
                  </span>
                  {isRecording && (
                    <div className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 h-1.5 bg-purple-400 animate-bounce" />
                      <span className="w-0.5 h-3 bg-purple-400 animate-bounce [animation-delay:0.1s]" />
                      <span className="w-0.5 h-2 bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate Pane (Local webcam) */}
              <div className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden aspect-video flex flex-col justify-between relative group shadow-lg">
                
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-stone-950">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                    <p className="text-xs text-stone-500">Camera permission denied</p>
                  </div>
                ) : cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#0c0a09]">
                    <VideoOff className="w-10 h-10 text-stone-600 mb-2" />
                    <p className="text-xs text-stone-500">Camera disabled</p>
                  </div>
                )}

                {/* Overlays */}
                <div className="z-10 p-4 flex items-center justify-between w-full">
                  <span className="bg-stone-950/85 text-[10px] border border-stone-800 px-2 py-0.5 rounded font-semibold text-stone-300">
                    Candidate Feed
                  </span>
                  {cameraActive && (
                    <span className="bg-red-950/80 border border-red-500/30 text-red-500 text-[9px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                      ● REC 1080p
                    </span>
                  )}
                </div>

                <div className="z-10 p-4 flex items-center justify-between w-full bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-xs font-semibold text-stone-200">You (Candidate)</span>
                  {micMuted && (
                    <MicOff className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>
              </div>

            </div>

            {/* Video Call Controls Toolbar */}
            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-wrap items-center justify-center gap-4 md:gap-6 shadow-md">
              <button
                type="button"
                onClick={() => setMicMuted(!micMuted)}
                className={`p-3 rounded-full border transition cursor-pointer ${
                  micMuted 
                    ? 'bg-red-950 border-red-550 text-red-500' 
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                }`}
                title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                className={`p-3 rounded-full border transition cursor-pointer ${
                  !cameraActive 
                    ? 'bg-red-950 border-red-550 text-red-500' 
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                }`}
                title={cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Dictation triggers */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-full border transition cursor-pointer flex items-center justify-center ${
                  isRecording 
                    ? 'bg-red-650 border-red-500 text-white animate-pulse' 
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                }`}
                title="Speak Answer (Speech-to-Text)"
              >
                {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-purple-400" />}
              </button>

              <div className="h-6 w-px bg-stone-850" />

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to end this interview room session?")) {
                    setSession(prev => ({ ...prev, status: 'COMPLETED' }));
                    stopCamera();
                    playChime('hangup');
                  }
                }}
                className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition cursor-pointer"
                title="Leave Meeting"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {/* Speech Waveform visuals */}
            {isRecording && (
              <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl flex items-center justify-center gap-6 animate-pulse">
                <span className="text-xs text-purple-300 font-bold uppercase tracking-wider">Dictation active: Speak now</span>
                <div className="flex gap-1 h-5 items-end">
                  <span className="w-1 bg-purple-400 rounded animate-bounce h-2" />
                  <span className="w-1 bg-purple-400 rounded animate-bounce [animation-delay:0.15s] h-4" />
                  <span className="w-1 bg-purple-400 rounded animate-bounce [animation-delay:0.3s] h-3" />
                  <span className="w-1 bg-purple-400 rounded animate-bounce [animation-delay:0.45s] h-5" />
                  <span className="w-1 bg-purple-400 rounded animate-bounce [animation-delay:0.6s] h-2" />
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Active Question Drawer & Workspace */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Question card */}
            <div className="bg-stone-900 border border-stone-850 rounded-2xl p-6 relative overflow-hidden shadow-md">
              <span className="bg-purple-900 border border-purple-700 text-purple-300 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                {activeQuestion.question_type} TASK
              </span>
              <h3 className="text-white font-extrabold text-lg mt-3 leading-snug">
                {activeQuestion.question_text}
              </h3>
              
              {activeQuestion.answer_hint && !evaluation && (
                <p className="text-[11px] text-stone-400 bg-stone-950 border border-stone-850 p-3 rounded-lg mt-3 leading-relaxed">
                  <span className="font-bold text-stone-300 block mb-0.5">Focus:</span> {activeQuestion.answer_hint}
                </p>
              )}
            </div>

            {/* Workspace forms */}
            {!evaluation && (
              <div className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden shadow-md">
                <div className="flex items-center justify-between border-b border-stone-850 bg-stone-950 px-4 py-2 text-xs">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setWorkspaceTab('verbal')}
                      className={`px-2.5 py-1 rounded font-bold transition ${
                        workspaceTab === 'verbal' ? 'bg-white text-stone-950' : 'text-stone-400'
                      }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setWorkspaceTab('code')}
                      className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${
                        workspaceTab === 'code' ? 'bg-white text-stone-950' : 'text-stone-400'
                      }`}
                    >
                      <Code className="w-3 h-3" />
                      Code
                    </button>
                  </div>

                  {workspaceTab === 'code' && (
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-stone-900 border border-stone-800 text-[10px] text-stone-350 px-1 py-0.5 rounded"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="cpp">C++</option>
                    </select>
                  )}
                </div>

                <form onSubmit={handleSubmitAnswer}>
                  <div className="p-4">
                    {workspaceTab === 'code' ? (
                      <div className="space-y-4">
                        <textarea
                          value={codeAnswer}
                          onChange={(e) => setCodeAnswer(e.target.value)}
                          rows={6}
                          className="w-full bg-stone-950 text-[#d4d4d4] font-mono p-3 rounded-xl border border-stone-800 focus:outline-none text-xs leading-relaxed"
                          disabled={submitting}
                        />
                        <textarea
                          placeholder="Brief explanation..."
                          value={verbalAnswer}
                          onChange={(e) => setVerbalAnswer(e.target.value)}
                          rows={3}
                          className="w-full bg-stone-950 text-white p-3 rounded-xl border border-stone-800 focus:outline-none text-xs leading-relaxed"
                          disabled={submitting}
                        />
                      </div>
                    ) : (
                      <textarea
                        placeholder="Type or dictate your verbal response..."
                        value={verbalAnswer}
                        onChange={(e) => setVerbalAnswer(e.target.value)}
                        rows={11}
                        className="w-full bg-stone-950 text-white p-3 rounded-xl border border-stone-800 focus:outline-none text-xs leading-relaxed"
                        required
                        disabled={submitting}
                      />
                    )}
                  </div>

                  <div className="p-3 bg-stone-950 border-t border-stone-850 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-white hover:bg-stone-200 disabled:bg-stone-800 text-stone-950 font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Evaluation scorecard card */}
            {evaluation && (
              <div className="bg-stone-900 border border-stone-850 rounded-2xl p-6 space-y-4 shadow-md animate-fade-in">
                <div className="flex items-center justify-between border-b border-stone-850 pb-2 text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-purple-400">
                    <Star className="w-4 h-4 fill-current text-amber-500" />
                    AI Scorecard
                  </span>
                  <span className="text-amber-500 font-extrabold">{evaluation.score}%</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Critique</h4>
                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-950 p-3 rounded-lg border border-stone-850 whitespace-pre-wrap">
                    {evaluation.feedback}
                  </p>
                </div>

                {evaluation.model_answer && (
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Exemplary Answer</h4>
                    <p className="text-xs text-stone-400 leading-relaxed bg-stone-950 p-3 rounded-lg border border-stone-850 whitespace-pre-wrap">
                      {evaluation.model_answer}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="w-full bg-white hover:bg-stone-250 text-stone-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow"
                >
                  {currentIdx + 1 < session.qa_pairs.length ? (
                    <>
                      Next Question
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Exit to Performance Summary
                      <Award className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
