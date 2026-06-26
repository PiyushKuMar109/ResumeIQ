import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      showToast('Login successful!', 'success');
      navigate('/dashboard');
    } else {
      setApiError(result.error);
      showToast(result.error, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-lg relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="mb-4 flex justify-center"
          >
            <BrandLogo className="justify-center" />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="text-slate-600 text-sm mt-2">Sign in to ResumeIQ and optimize your ATS score.</p>
        </div>

        {isExpired && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>Your session has expired. Please log in again.</span>
          </div>
        )}

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="you@example.com"
                className={`w-full bg-white border ${errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'} rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200`}
              />
            </div>
            {errors.email && <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition">Forgot Password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
                className={`w-full bg-white border ${errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'} rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200`}
              />
            </div>
            {errors.password && <p className="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2 group transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
