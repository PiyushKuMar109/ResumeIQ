import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayName, getUserInitials } from '../utils/apiHelpers';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-20 border-b border-stone-200/80 px-6 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-xl">
      <div className="relative w-72 md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4.5 h-4.5" />
        <input
          type="text"
          placeholder="Search resume analyses..."
          className="w-full rounded-2xl border border-stone-200 bg-[#fbfaf7] py-2.5 pl-10 pr-4 text-xs text-stone-700 shadow-sm outline-none transition focus:border-amber-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-2xl border border-stone-200 bg-[#fbfaf7] p-2.5 text-stone-500 shadow-sm transition hover:bg-stone-100 hover:text-stone-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 pl-4 border-l border-stone-200 cursor-pointer hover:opacity-85 transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 font-semibold text-sm text-amber-700">
            {getUserInitials(user)}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-stone-800">{getUserDisplayName(user)}</p>
            <p className="text-[10px] text-stone-500 font-medium capitalize">{user?.role || 'USER'}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
