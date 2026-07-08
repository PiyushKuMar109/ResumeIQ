import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Coins, 
  User, 
  Plus, 
  Video, 
  Check, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getInterviewerDashboard, createSlot } from '../services/interviewService';
import { extractData } from '../utils/apiHelpers';

export default function InterviewerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Dashboard Stats
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingSlot, setAddingSlot] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Form States
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    fetchDashboardDetails();
  }, []);

  const fetchDashboardDetails = async () => {
    try {
      setLoading(true);
      const res = await getInterviewerDashboard();
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load dashboard details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!slotDate || !slotTime) return;

    try {
      setAddingSlot(true);
      const startDateTimeStr = `${slotDate}T${slotTime}:00`;
      const startDateTime = new Date(startDateTimeStr);
      
      // Fixed 45-minute slots
      const endDateTime = new Date(startDateTime.getTime() + 45 * 60 * 1000);

      const res = await createSlot({
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString()
      });

      if (res.data.success) {
        showToast('Availability slot added successfully!', 'success');
        setSlotDate('');
        setSlotTime('');
        fetchDashboardDetails(); // Refresh details
      }
    } catch (err) {
      showToast('Failed to create availability slot', 'error');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleRequestWithdrawal = (e) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) return;

    const totalCredits = user?.credits || 0;
    if (amount > totalCredits) {
      showToast('Insufficient earnings balance', 'error');
      return;
    }

    setWithdrawing(true);
    setTimeout(() => {
      const platformFee = Math.round(amount * 0.20);
      const netAmount = amount - platformFee;
      showToast(`Payout request submitted successfully! platform fee: ${platformFee} credits. Net payout: $${netAmount} USD transferred.`, 'success');
      setWithdrawAmount('');
      setWithdrawing(false);
    }, 1200);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-650" />
          <p className="text-slate-500 mt-3 text-sm">Loading interviewer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen text-slate-800 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-750 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
            Interviewer Hub
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-3">
            Welcome back, {user?.full_name || user?.email}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Manage your schedule slots, track candidate appointments, and request credit withdrawals.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <Coins className="w-6 h-6 text-indigo-650" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Wallet Balance</span>
              <h3 className="text-2xl font-black text-stone-900">{user?.credits || 0} credits</h3>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <Briefcase className="w-6 h-6 text-indigo-650" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Total Bookings</span>
              <h3 className="text-2xl font-black text-stone-900">{dashboardData?.bookings_count || 0} sessions</h3>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <Calendar className="w-6 h-6 text-indigo-650" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Created Slots</span>
              <h3 className="text-2xl font-black text-stone-900">{dashboardData?.slots_count || 0} slots</h3>
            </div>
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Booked Appointments */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">Upcoming Candidate Appointments</h3>
            </div>

            {(!dashboardData?.bookings || dashboardData.bookings.length === 0) ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-500 font-semibold shadow-sm">
                No scheduled appointments found.
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.bookings.map((booking) => (
                  <div key={booking.id} className="bg-white border border-stone-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {booking.candidate.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-sm">{booking.candidate.full_name || booking.candidate.email}</h4>
                          <span className="inline-block bg-[#f8f5ef] text-stone-700 border border-stone-200 text-[9px] px-2 py-0.5 rounded font-black tracking-wide">
                            {booking.session_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500 font-semibold pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.slot_detail.start_time)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(booking.slot_detail.start_time)} - {formatTime(booking.slot_detail.end_time)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/live-call/${booking.id}`)}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Live Call
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Add Slots & Withdrawals */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Create Slot */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-md font-extrabold text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-650" />
                Add Availability Slot
              </h3>

              <form onSubmit={handleAddSlot} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Date</label>
                    <input
                      type="date"
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={slotTime}
                      onChange={(e) => setSlotTime(e.target.value)}
                      className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addingSlot}
                  className="w-full bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {addingSlot && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add 45m Slot
                </button>
              </form>
            </div>

            {/* Withdraw Payout */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-md font-extrabold text-stone-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-650" />
                Request Credit Payout
              </h3>

              <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Credits to Withdraw</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#fdfcf9] border border-stone-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-600 transition"
                    required
                  />
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-[10px] text-stone-500 font-semibold leading-relaxed">
                  * Payouts are converted to USD. A 20% platform service fee is automatically applied.
                </div>

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:bg-stone-300 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {withdrawing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Request Withdrawal Payout
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
