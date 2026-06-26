import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8] text-stone-900 px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <BrandLogo className="justify-center" />
        </div>
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-stone-600 mb-8">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
