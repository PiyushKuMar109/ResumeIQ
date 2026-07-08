import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock, 
  Coins, 
  Tag, 
  ChevronRight, 
  Info, 
  Plus, 
  Video, 
  Check, 
  Loader2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getInterviewers, getSlots, bookSlot, addCredits } from '../services/interviewService';
import { extractData } from '../utils/apiHelpers';

export default function BookInterviewer() {
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuth();
  const { showToast } = useToast();
  
  // Data States
  const [interviewers, setInterviewers] = useState([]);
  const [loadingInterviewers, setLoadingInterviewers] = useState(true);
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Action States
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [addingCreditsInProgress, setAddingCreditsInProgress] = useState(false);
  const [skillFilter, setSkillFilter] = useState('All');

  const categories = ['All', 'React', 'Django', 'TypeScript', 'Python', 'Docker', 'AWS'];

  useEffect(() => {
    fetchInterviewersList();
  }, []);

  const fetchInterviewersList = async () => {
    try {
      setLoadingInterviewers(true);
      const res = await getInterviewers();
      setInterviewers(extractData(res) || []);
    } catch (err) {
      showToast('Failed to load interviewers', 'error');
    } finally {
      setLoadingInterviewers(false);
    }
  };

  const handleSelectInterviewer = async (interviewer) => {
    setSelectedInterviewer(interviewer);
    setSelectedSlot(null);
    try {
      setLoadingSlots(true);
      const res = await getSlots(interviewer.id);
      setSlots(extractData(res) || []);
    } catch (err) {
      showToast('Failed to load availability slots', 'error');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookSession = async () => {
    if (!selectedSlot) return;
    try {
      setBookingInProgress(true);
      const res = await bookSlot(selectedSlot.id);
      if (res.data.success) {
        showToast('Mock Interview Session Booked successfully!', 'success');
        // Refresh profile to update credits
        fetchProfile();
        // Remove booked slot
        setSlots(prev => prev.filter(s => s.id !== selectedSlot.id));
        setSelectedSlot(null);
        // Show success modal or redirect to live call workspace simulation
        if (confirm("Slot booked! Would you like to enter the live interview workspace room now?")) {
          navigate(`/live-call/${res.data.data.id}`);
        }
      } else {
        showToast(res.data.message || 'Failed to book slot', 'error');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error occurred during booking';
      showToast(errorMsg, 'error');
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleAddFreeCredits = async () => {
    try {
      setAddingCreditsInProgress(true);
      const res = await addCredits(50);
      if (res.data.success) {
        showToast('Successfully added 50 mock credits!', 'success');
        fetchProfile();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add credits';
      showToast(errMsg, 'error');
    } finally {
      setAddingCreditsInProgress(false);
    }
  };

  const filteredInterviewers = interviewers.filter(i => {
    if (skillFilter === 'All') return true;
    return (i.skills || '').toLowerCase().includes(skillFilter.toLowerCase());
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8 min-h-screen text-slate-800 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-650" />
              Book a Live Peer-to-Peer Interview
            </h1>
            <p className="text-stone-600 text-sm max-w-xl">
              Select an expert reviewer to evaluate your resume, run live coding questions, and provide direct behavioral critiques.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex items-center gap-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Coins className="w-6 h-6 text-indigo-650" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Your Balance</span>
                <h3 className="text-2xl font-extrabold text-stone-900">{user?.credits || 0} credits</h3>
              </div>
            </div>

            <button
              onClick={handleAddFreeCredits}
              disabled={addingCreditsInProgress}
              className="bg-stone-950 hover:bg-stone-850 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:bg-stone-300"
            >
              {addingCreditsInProgress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Free 50 Credits
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Interviewers list */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">Available Interviewers</h3>
              <span className="text-xs text-stone-500 font-semibold">{filteredInterviewers.length} profiles found</span>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSkillFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    skillFilter === cat 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loadingInterviewers ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-650 mx-auto" />
                <p className="text-xs text-stone-500 mt-3 font-semibold">Fetching expert interviewers...</p>
              </div>
            ) : filteredInterviewers.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-500">
                No interviewers match your selected filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredInterviewers.map((item) => (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    key={item.id}
                    onClick={() => handleSelectInterviewer(item)}
                    className={`bg-white border p-6 rounded-3xl cursor-pointer flex flex-col sm:flex-row justify-between items-start gap-4 transition shadow-sm ${
                      selectedInterviewer?.id === item.id 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="space-y-3 max-w-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                          {item.user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-md">{item.user.full_name || item.user.email}</h4>
                          <p className="text-xs text-stone-500 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            {item.title} at <span className="font-semibold text-stone-850">{item.company}</span>
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed font-medium">
                        {item.bio}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.skills?.split(',').map((skill, index) => (
                          <span key={index} className="inline-flex items-center gap-1 bg-stone-105/10 border border-stone-200/50 text-[10px] text-stone-700 px-2.5 py-0.5 rounded-full font-bold">
                            <Tag className="w-2.5 h-2.5" />
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 border-stone-100 pt-4 sm:pt-0">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Session Fee</span>
                        <span className="text-xl font-black text-indigo-650">{item.credit_rate} credits</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-stone-400 hidden sm:block mt-3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Available Slots picker */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">Choose a Schedule</h3>
            </div>

            {!selectedInterviewer ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
                <Info className="w-8 h-8 text-stone-400 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-stone-600">Select an interviewer from the list to view their calendar slot availability</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-6 shadow-sm">
                
                {/* Selected Interviewer Summary */}
                <div className="border-b border-stone-150 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {selectedInterviewer.user.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{selectedInterviewer.user.full_name}</h4>
                    <p className="text-[11px] text-stone-500">{selectedInterviewer.title}</p>
                  </div>
                </div>

                {/* Slots display */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-stone-600 uppercase tracking-wider">Available Slots</h4>
                  
                  {loadingSlots ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-650 mx-auto" />
                      <p className="text-[11px] text-stone-500 mt-2">Checking slots...</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bg-stone-50 p-6 rounded-2xl text-center border border-stone-200 text-xs text-stone-500 font-semibold">
                      This interviewer has no upcoming slots scheduled.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                            selectedSlot?.id === slot.id
                              ? 'bg-indigo-650 text-white border-indigo-650 shadow-md'
                              : 'bg-[#faf9f6] text-stone-850 border-stone-200 hover:bg-stone-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 text-xs font-semibold">
                            <Clock className={`w-4 h-4 ${selectedSlot?.id === slot.id ? 'text-white' : 'text-indigo-600'}`} />
                            <div>
                              <p className="font-extrabold">{formatDate(slot.start_time)}</p>
                              <p className={`text-[10px] ${selectedSlot?.id === slot.id ? 'text-indigo-200' : 'text-stone-500'}`}>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </p>
                            </div>
                          </div>
                          {selectedSlot?.id === slot.id && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booking Button */}
                {selectedSlot && (
                  <div className="bg-stone-50 p-4 border border-stone-200 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-stone-700">
                      <span>Total Cost:</span>
                      <span className="font-black text-stone-900 text-sm">{selectedInterviewer.credit_rate} credits</span>
                    </div>

                    <button
                      onClick={handleBookSession}
                      disabled={bookingInProgress}
                      className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                    >
                      {bookingInProgress ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing Booking...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          Confirm Slot Booking
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
