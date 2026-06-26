import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Globe, Loader2, Mail, Phone, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    linkedin_profile: '',
    github_profile: '',
    portfolio_url: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        linkedin_profile: user.linkedin_profile || '',
        github_profile: user.github_profile || '',
        portfolio_url: user.portfolio_url || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateUser(formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      showToast('Profile updated successfully!', 'success');
    } else {
      setMessage({ type: 'error', text: result.error });
      showToast(result.error, 'error');
    }

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight">Edit Profile</h2>
          <p className="text-slate-400 text-sm mt-2">Update your personal information.</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-400">Basic Information</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">LinkedIn Profile</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="url"
                  name="linkedin_profile"
                  value={formData.linkedin_profile}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">GitHub Profile</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="url"
                  name="github_profile"
                  value={formData.github_profile}
                  onChange={handleChange}
                  placeholder="https://github.com/your-username"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Portfolio URL</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  placeholder="https://your-portfolio.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Role</label>
              <p className="text-slate-300 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
