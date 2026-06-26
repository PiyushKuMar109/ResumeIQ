import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import API from '../api/axios';
import BrandLogo from '../components/BrandLogo';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mockLink, setMockLink] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const onSubmitRequest = async (data) => {
    setLoading(true);
    setApiError('');
    setSuccessMsg('');
    try {
      const response = await API.post('/auth/password-reset/', { email: data.email });
      setSuccessMsg(response.data.message);
      if (response.data.reset_link) {
        setMockLink(response.data.reset_link);
      }
    } catch (error) {
      setApiError(error.response?.data?.error || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitConfirm = async (data) => {
    setLoading(true);
    setApiError('');
    setSuccessMsg('');
    try {
      await API.post('/auth/password-reset-confirm/', {
        token: token,
        password: data.password
      });
      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setApiError(error.response?.data?.error || 'Failed to reset password. The link may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const isResetting = !!token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 relative overflow-hidden px-4">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <BrandLogo className="justify-center" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isResetting ? 'Reset Password' : 'Forgot Password'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-light">
            {isResetting ? 'Enter a new secure password for your account' : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mockLink && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-purple-700 text-xs font-mono break-all select-all text-left">
            <p className="text-slate-500 font-sans text-xs mb-2">Mock Reset Link (Instant Access):</p>
            <a href={mockLink} className="underline text-purple-700">{mockLink}</a>
          </div>
        )}

        {!successMsg || mockLink ? (
          isResetting ? (
            <form onSubmit={handleSubmit(onSubmitConfirm)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' }
                    })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200"
                  />
                </div>
                {errors.password && <p className="text-rose-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="password"
                    {...register('confirm_password', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200"
                  />
                </div>
                {errors.confirm_password && <p className="text-rose-500 text-xs mt-1.5">{errors.confirm_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2 group transition duration-300 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Password</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200"
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2 group transition duration-300 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Request Reset Link</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )
        ) : null}

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-400 text-sm transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
