import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import API from '../api/axios';
import BrandLogo from '../components/BrandLogo';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check the link in your email.');
        return;
      }

      try {
        const response = await API.post('/auth/verify-email/', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may have expired or is invalid.');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 relative overflow-hidden px-4">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-lg relative z-10 text-center"
      >
        <div className="mb-6 flex justify-center">
          <BrandLogo className="justify-center" />
        </div>
        {status === 'verifying' && (
          <div>
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Verifying Email</h2>
            <p className="text-slate-400 text-sm">Please hold on while we verify your credentials with our servers...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Verification Complete!</h2>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2 group transition duration-300 cursor-pointer"
            >
              <span>Continue to Log In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-10 h-10" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-rose-400 text-sm mb-8">{message}</p>
            <Link
              to="/register"
              className="block w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold py-3 px-4 rounded-xl transition mb-4"
            >
              Register Again
            </Link>
            <Link
              to="/login"
              className="text-sm text-slate-500 hover:text-slate-400 transition"
            >
              Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
