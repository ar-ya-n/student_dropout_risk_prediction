import { useState } from 'react';
import { motion } from 'framer-motion';
import FileUpload from '../components/FileUpload';
import ResultsTable from '../components/ResultsTable';
import StudentModal from '../components/StudentModal';
import Loader from '../components/Loader';
import { predictBatch } from '../services/api';

export default function BatchUpload() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await predictBatch(file);
      setResults(data.results);
      // Persist for dashboard
      localStorage.setItem('predictions', JSON.stringify(data.results));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Batch Upload</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload a CSV file to analyze multiple students at once
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 mb-6">
        <FileUpload onFileSelect={setFile} />

        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-4"
          >
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/20 hover:shadow-xl hover:from-primary-400 hover:to-violet-400 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : '🚀 Analyze Students'}
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </div>

      {/* Loading */}
      {loading && <Loader text="Processing CSV file..." />}

      {/* Results */}
      {results && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Results ({results.length} students)
            </h3>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                High: {results.filter((r) => r.risk_level === 'High Risk').length}
              </span>
              <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                Medium: {results.filter((r) => r.risk_level === 'Medium Risk').length}
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                Low: {results.filter((r) => r.risk_level === 'Low Risk').length}
              </span>
            </div>
          </div>

          <ResultsTable data={results} onViewDetails={setSelectedStudent} />
        </motion.div>
      )}

      {/* Modal */}
      {selectedStudent && (
        <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
