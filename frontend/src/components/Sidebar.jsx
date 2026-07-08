import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Briefcase,
  FileBarChart,
  User,
  LogOut,
  Sparkles,
  Mail,
  ListTodo,
  Compass,
  TrendingUp,
  Code,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';


const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Upload Resume', icon: Upload, to: '/upload-resume' },
  { label: 'My Resumes', icon: FileText, to: '/resumes' },
  { label: 'Job Recommendations', icon: Briefcase, to: '/jobs' },
  { label: 'Reports', icon: FileBarChart, to: '/reports' },
  { label: 'Profile', icon: User, to: '/profile' },
  { label: 'Mock Interview', icon: Sparkles, to: '/interview-session' },
  { label: 'Book P2P Interview', icon: Calendar, to: '/book-interviewer' },
  { label: 'Cover Letter Gen', icon: Mail, to: '/cover-letter' },
  { label: 'Kanban Tracker', icon: ListTodo, to: '/job-tracker' },
  { label: 'Career Roadmap', icon: Compass, to: '/career-roadmap' },
  { label: 'ATS Keyword Cloud', icon: TrendingUp, to: '/keyword-visualizer' },
  { label: 'Code Refactorer', icon: Code, to: '/code-refactorer' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const activeNavItems = navItems.map(item => {
    if (item.to === '/book-interviewer' && user?.is_interviewer) {
      return { label: 'Interviewer Hub', icon: LayoutDashboard, to: '/interviewer-dashboard' };
    }
    return item;
  });

  return (
    <aside className="w-64 border-r border-stone-200 bg-[#fcfaf6] flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        <div className="p-6 border-b border-stone-200 flex items-center gap-3">
          <BrandLogo textClassName="text-sm" />
        </div>

        <nav className="p-4 space-y-1">
          {activeNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-[0_14px_30px_rgba(28,25,23,0.16)]'
                    : 'text-stone-600 hover:bg-white hover:text-stone-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-300/20 rounded-full blur-2xl" />
          <div className="flex items-center gap-1 text-amber-700 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow Boost</span>
          </div>
          <p className="text-xs text-stone-600 font-medium mb-3 leading-5">
            Keep the full resume-to-report journey moving with cleaner navigation and faster access.
          </p>
          <button
            onClick={() => navigate('/upload-resume')}
            className="w-full rounded-2xl bg-stone-950 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 cursor-pointer"
          >
            Start New Analysis
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:bg-white hover:text-rose-500 rounded-2xl text-sm font-semibold transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
