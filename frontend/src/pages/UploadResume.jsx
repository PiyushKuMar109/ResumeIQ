import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { uploadResume } from '../services/resumeService';
import { useToast } from '../context/ToastContext';
import { extractData, getErrorMessage } from '../utils/apiHelpers';

const VALID_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function UploadResume() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!VALID_TYPES.includes(file.type)) {
      setError('Please upload a PDF or DOCX file');
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5 MB');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError('');
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a resume title');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);

      const response = await uploadResume(formData);
      const data = extractData(response);
      const resumeId = data?.id || response?.data?.id;
      showToast('Resume uploaded successfully!', 'success');
      navigate(resumeId ? `/analyze/${resumeId}` : '/resumes');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to upload resume');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Resume</h1>
        <p className="text-slate-400 text-sm mb-8">Upload a PDF or DOCX file (max 5 MB) to get started.</p>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Resume Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Developer 2024"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select File (PDF or DOCX)</label>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500 transition">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx"
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                <p className="text-slate-300">Click to select or drag and drop</p>
                <p className="text-sm text-slate-500 mt-1">PDF or DOCX (max 5 MB)</p>
              </label>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-emerald-400">Selected: {selectedFile.name}</p>
            )}
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Resume'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
