import React, { useState } from 'react';
import { Loader2, Code, Terminal, CheckCircle2, AlertCircle, Copy, Check, Clock, Cpu } from 'lucide-react';
import { refactorCode } from '../services/resumeService';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

export default function CodeRefactorer() {
  const [codeText, setCodeText] = useState('def find_duplicates(arr):\n    # Slow O(N^2) solution\n    dups = []\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in dups:\n                dups.append(arr[i])\n    return dups');
  const [language, setLanguage] = useState('python');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleRefactor = async (e) => {
    e.preventDefault();
    if (!codeText.trim()) {
      setError('Please enter some code to refactor.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setCopied(false);
      const response = await refactorCode(codeText, language);
      setResult(extractData(response));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to optimize code'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.refactored_code) {
      navigator.clipboard.writeText(result.refactored_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 text-stone-900">
            <Code className="w-8 h-8 text-purple-650" />
            AI Interview Code Refactoring Assistant
          </h1>
          <p className="text-stone-600 mt-1">Refactor slow code snippets into production-ready complexity patterns with clean structures.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-red-650 bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form Input */}
        <div className="bg-white border border-stone-200 rounded-[28px] p-6 shadow-sm">
          <form onSubmit={handleRefactor} className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-3">
              <span className="text-xs font-bold text-stone-650 uppercase tracking-wider">Input Workspace</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#fcfaf6] border border-stone-200 text-xs px-2.5 py-1 rounded-md text-stone-850 focus:outline-none"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              rows={8}
              className="w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 rounded-xl border border-stone-800 focus:outline-none text-xs leading-relaxed"
              style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e' }}
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-stone-950 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Optimizing Algorithms...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4" />
                    Refactor Code
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Split screen results */}
        {result && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Original Code */}
              <div className="bg-stone-950 border border-stone-900 rounded-[28px] overflow-hidden flex flex-col justify-between shadow-lg">
                <div className="bg-[#18181b] border-b border-stone-900 px-5 py-3 text-xs text-stone-400 font-bold uppercase tracking-wider">
                  Original Code
                </div>
                <div className="p-5 font-mono text-[11px] leading-relaxed text-stone-300 overflow-x-auto whitespace-pre">
                  {codeText}
                </div>
                <div className="p-3 bg-[#18181b] border-t border-stone-900 text-[10px] text-stone-500 font-bold">
                  Complexity: {result.original_time || 'O(N^2)'} time
                </div>
              </div>

              {/* Right Column: Refactored Code */}
              <div className="bg-stone-950 border border-purple-500/25 rounded-[28px] overflow-hidden flex flex-col justify-between shadow-lg">
                <div className="bg-[#18181b] border-b border-stone-900 px-5 py-3 text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  AI Refactored Code
                  <button
                    onClick={handleCopy}
                    className="text-stone-400 hover:text-white transition flex items-center gap-1 cursor-pointer text-[10px]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="p-5 font-mono text-[11px] leading-relaxed text-purple-200 overflow-x-auto whitespace-pre bg-purple-950/5">
                  {result.refactored_code}
                </div>
                <div className="p-3 bg-[#18181b] border-t border-stone-900 text-[10px] text-purple-400 font-bold">
                  Complexity: {result.refactored_time || 'O(N)'} time
                </div>
              </div>

            </div>

            {/* Complexity Cards and Specific Improvements checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Time Complexity Speedup */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Time Complexity</span>
                  <p className="text-base font-extrabold text-stone-900">
                    {result.original_time || 'O(N^2)'} → {result.refactored_time || 'O(N)'}
                  </p>
                </div>
              </div>

              {/* Card 2: Space Complexity */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Space Complexity</span>
                  <p className="text-base font-extrabold text-stone-900">
                    {result.original_space || 'O(1)'} → {result.refactored_space || 'O(N)'}
                  </p>
                </div>
              </div>

              {/* Card 3: Specific Improvements List */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm md:col-span-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-3">Clean Code Checkpoints</span>
                <div className="space-y-2">
                  {result.improvements?.map((imp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-600">
                      <CheckCircle2 className="w-4 h-4 text-purple-650 flex-shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
