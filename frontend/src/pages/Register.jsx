import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BrandLogo from '../components/BrandLogo';

export default function Register() {
  const { register: registerAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    setSuccessData(null);

    const payload = {
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      role,
      phone_number: data.phone_number,
      department: data.department,
    };

    const result = await registerAuth(payload);
    if (result.success) {
      if (result.autoLogin) {
        showToast('Registration successful!', 'success');
        navigate('/dashboard');
      } else {
        setSuccessData({ message: result.message });
        showToast('Registration successful! Please log in.', 'success');
      }
    } else {
      setApiError(result.error);
      showToast(result.error, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 relative overflow-hidden py-12 px-4">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-lg relative z-10"
      >
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div key="register-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-7 text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className="mb-4 flex justify-center"
                >
                  <BrandLogo className="justify-center" />
                </motion.div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
                <p className="text-slate-600 text-sm mt-2">Join ResumeIQ to optimize your career path.</p>

                <div className="flex bg-white border border-slate-200 rounded-xl p-1 mt-6 max-w-xs mx-auto shadow-sm">
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${role === 'USER'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                      : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${role === 'ADMIN'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                      : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              {apiError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        {...register('first_name', { required: 'First name is required' })}
                        placeholder="Your Name"
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition"
                      />
                    </div>
                    {errors.first_name && <p className="text-red-500 text-xs mt-1.5">{errors.first_name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        {...register('last_name', { required: 'Last name is required' })}
                        placeholder="Last Name"
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition"
                      />
                    </div>
                    {errors.last_name && <p className="text-red-500 text-xs mt-1.5">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      placeholder="Your.mail@example.com"
                      className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      })}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition"
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                </div>

                {role === 'USER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        {...register('phone_number')}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {role === 'ADMIN' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Department Name</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        {...register('department', { required: 'Department is required for admin' })}
                        placeholder="Human Resources / Recruiting"
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition"
                      />
                    </div>
                    {errors.department && <p className="text-red-500 text-xs mt-1.5">{errors.department.message}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2 transition duration-300 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Register Account</span>}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-slate-600 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-purple-600 hover:text-purple-500 font-medium transition">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
              <p className="text-slate-600 text-sm mb-8">{successData.message}</p>
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl transition"
              >
                Go to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
