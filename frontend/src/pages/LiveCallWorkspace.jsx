import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  PhoneOff, 
  Cpu, 
  User, 
  Terminal, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Play,
  Check,
  Loader2,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LiveCallWorkspace() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Media States
  const [cameraActive, setCameraActive] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Timer & Chat States
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'helper'
  const [chatMessage, setChatMessage] = useState('');
  const [chatLedger, setChatLedger] = useState([
    { sender: 'interviewer', text: 'Hello! Welcome to your peer mock interview session. Let me know when you are ready to begin.', time: '10:00 AM' },
  ]);

  // AI Helper questions
  const [questions, setQuestions] = useState([
    { id: 1, text: 'Design a rate limiter for a high-traffic microservice architecture.', type: 'SYSTEM DESIGN' },
    { id: 2, text: 'Explain how React Fiber schedules updates and reconciles the virtual DOM.', type: 'FRONTEND' },
    { id: 3, text: 'Write a function to detect and resolve cyclic references in a graph.', type: 'CODING' }
  ]);

  useEffect(() => {
    // Start session timer
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    // Startup camera
    startCamera();

    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, []);

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

  const handleToggleCamera = () => {
    if (cameraActive) {
      stopCamera();
      setCameraActive(false);
    } else {
      startCamera();
      setCameraActive(true);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'candidate', text: chatMessage, time };
    setChatLedger(prev => [...prev, newMsg]);
    setChatMessage('');

    // Simulate peer interviewer response
    setTimeout(() => {
      const responses = [
        "That's a very solid explanation. Can you elaborate on the time complexity?",
        "Excellent approach. How would you handle scaling this across multiple database nodes?",
        "Let's look at the trade-offs of using caching here. What are the key cache invalidation strategies you'd consider?",
        "Makes sense! Let's move on to the coding challenge on the screen."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatLedger(prev => [...prev, { sender: 'interviewer', text: randomResponse, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1500);
  };

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (confirm("Are you sure you want to end this peer-to-peer interview room? Your session metrics will be logged.")) {
      showToast("Live interview session complete!", "success");
      navigate('/dashboard');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-stone-950 min-h-[calc(100vh-5rem)] text-white rounded-[24px]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Call Workspace Header */}
        <div className="flex flex-wrap items-center justify-between bg-stone-900 border border-stone-850 p-4 rounded-2xl gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-red-650 rounded-full animate-pulse" />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Live Peer-to-Peer Interview Room
              </h2>
              <p className="text-[10px] text-stone-400">Booking Reference: #{bookingId || 'P2P-3882'} | Safe connection active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-stone-300">
            <div className="bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>ELAPSED: {formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Meeting Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Side: Camera Feeds */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Interviewer Camera Block */}
              <div className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden aspect-video flex flex-col justify-between p-4 relative group shadow-lg">
                <div className="flex items-center justify-between z-10">
                  <span className="bg-stone-950/80 text-[10px] border border-stone-800 px-2 py-0.5 rounded font-semibold text-indigo-400">
                    Interviewer (Peer Expert)
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>

                <div className="my-auto text-center space-y-3">
                  <div className="w-16 h-16 bg-indigo-900 border border-indigo-500/30 rounded-full mx-auto flex items-center justify-center shadow-inner relative">
                    <User className="w-8 h-8 text-indigo-300" />
                    <span className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-20" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Interviewer</h4>
                    <p className="text-[11px] text-stone-400">Connecting from Corporate Hub</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 z-10">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    Audio Connected
                  </span>
                </div>
              </div>

              {/* Candidate Camera Block (Local webcam) */}
              <div className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden aspect-video flex flex-col justify-between relative group shadow-lg">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-stone-950">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                    <p className="text-xs text-stone-500 font-semibold">Webcam block. Check browser permissions.</p>
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
                    <p className="text-xs text-stone-500 font-semibold">Webcam disabled</p>
                  </div>
                )}

                {/* Overlays */}
                <div className="z-10 p-4 flex items-center justify-between w-full">
                  <span className="bg-stone-950/85 text-[10px] border border-stone-800 px-2 py-0.5 rounded font-semibold text-stone-300">
                    Your Stream
                  </span>
                  {cameraActive && (
                    <span className="bg-green-950/80 border border-green-500/30 text-green-400 text-[9px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>

                <div className="z-10 p-4 flex items-center justify-between w-full bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-xs font-semibold text-stone-250">{user?.full_name || user?.email} (Candidate)</span>
                </div>
              </div>

            </div>

            {/* Video Call Controls Toolbar */}
            <div className="bg-stone-900 border border-stone-850 p-4 rounded-2xl flex flex-wrap items-center justify-center gap-4 shadow-md">
              <button
                type="button"
                onClick={() => setMicMuted(!micMuted)}
                className={`p-3 rounded-full border transition cursor-pointer ${
                  micMuted 
                    ? 'bg-red-950 border-red-550 text-red-500' 
                    : 'bg-stone-800 border-stone-750 text-stone-300 hover:bg-stone-700'
                }`}
                title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleToggleCamera}
                className={`p-3 rounded-full border transition cursor-pointer ${
                  !cameraActive 
                    ? 'bg-red-950 border-red-550 text-red-500' 
                    : 'bg-stone-800 border-stone-750 text-stone-300 hover:bg-stone-700'
                }`}
                title={cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <div className="h-6 w-px bg-stone-800" />

              <button
                type="button"
                onClick={handleEndCall}
                className="p-3 bg-red-650 hover:bg-red-550 text-white rounded-full transition cursor-pointer"
                title="Leave Session"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Side: Chat & Helper Tabs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden shadow-md flex flex-col h-[400px]">
              
              {/* Tab Header */}
              <div className="flex items-center justify-between border-b border-stone-850 bg-stone-950 px-4 py-2 text-xs">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === 'chat' ? 'bg-white text-stone-950' : 'text-stone-400'
                    }`}
                  >
                    Chat Console
                  </button>
                  <button
                    onClick={() => setActiveTab('helper')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === 'helper' ? 'bg-white text-stone-950' : 'text-stone-400'
                    }`}
                  >
                    AI Helper
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <AnimatePresence mode="wait">
                  {activeTab === 'chat' ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 h-full flex flex-col justify-between"
                    >
                      {/* Messages scrollarea */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-1">
                        {chatLedger.map((msg, index) => (
                          <div 
                            key={index}
                            className={`flex flex-col ${msg.sender === 'candidate' ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[9px] text-stone-500 mb-0.5 font-bold uppercase tracking-wide">
                              {msg.sender === 'candidate' ? 'You' : 'Interviewer'}
                            </span>
                            <p className={`text-xs p-3 rounded-2xl max-w-[85%] ${
                              msg.sender === 'candidate' 
                                ? 'bg-indigo-650 text-white rounded-tr-none' 
                                : 'bg-stone-800 text-stone-200 rounded-tl-none border border-stone-750'
                            }`}>
                              {msg.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendChat} className="flex gap-2 border-t border-stone-850 pt-3 mt-auto">
                        <input
                          type="text"
                          placeholder="Send message to interviewer..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="bg-white hover:bg-stone-200 text-stone-950 p-2.5 rounded-xl transition cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="helper"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        Recommended Peer Tasks
                      </h4>
                      <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                        Here are some recommended questions you can ask the peer interviewer or discuss together during this practice slot.
                      </p>

                      <div className="space-y-2.5">
                        {questions.map((q) => (
                          <div key={q.id} className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl space-y-1.5">
                            <span className="bg-purple-950 text-purple-300 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide border border-purple-500/20">
                              {q.type}
                            </span>
                            <p className="text-xs text-stone-250 font-bold leading-relaxed">{q.text}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
