import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

export default function FileUpload({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFile = useCallback(
    (file) => {
      if (file && file.name.endsWith('.csv')) {
        setFileName(file.name);
        onFileSelect(file);
      } else {
        alert('Please upload a .csv file');
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
        dragActive
          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-primary-300'
      }`}
    >
      <input
        type="file"
        accept=".csv"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div className="space-y-3">
        <div className="text-4xl">📁</div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {fileName ? (
            <>
              Selected: <span className="text-primary-600 dark:text-primary-400">{fileName}</span>
            </>
          ) : (
            <>
              Drag & drop a CSV file here, or <span className="text-primary-600 dark:text-primary-400 underline">browse</span>
            </>
          )}
        </p>
        <p className="text-xs text-slate-400">Maximum file size: 5 MB</p>
      </div>
    </motion.div>
  );
}
