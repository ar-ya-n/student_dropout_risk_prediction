import { motion, AnimatePresence } from 'framer-motion';

function riskColor(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high')) return { bg: 'bg-red-50 dark:bg-slate-900', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100' };
  if (l.includes('medium')) return { bg: 'bg-amber-50 dark:bg-slate-900', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' };
  return { bg: 'bg-emerald-50 dark:bg-slate-900', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100' };
}

export default function StudentModal({ student, onClose }) {
  if (!student) return null;

  const colors = riskColor(student.risk_level);
  const probability = (student.probability * 100).toFixed(1);

  // Generate explanation bullets
  const explanations = [];
  if (student.gpa !== undefined && student.gpa < 2.5) explanations.push('Low academic performance (GPA below 2.5)');
  if (student.attendance_rate !== undefined && student.attendance_rate < 75) explanations.push('Poor attendance (below 75%)');
  if (student.num_failed_courses !== undefined && student.num_failed_courses >= 2) explanations.push('Multiple course failures');
  if (student.probability >= 0.7) explanations.push('Very high dropout probability detected');
  else if (student.probability >= 0.4) explanations.push('Moderate dropout probability');
  if (explanations.length === 0) explanations.push('Student appears to be on track');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-lg rounded-2xl border ${colors.border} ${colors.bg} p-8 shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Student Details</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                ID: {student.id || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-300"
            >
              ✕
            </button>
          </div>

          {/* Risk Badge */}
          <div className="flex items-center gap-4 mb-6">
            <span className={`px-4 py-2 rounded-xl text-lg font-bold ${colors.badge}`}>
              {student.risk_level}
            </span>
            <span className={`text-2xl font-bold ${colors.text}`}>{probability}%</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl bg-white/60 dark:bg-slate-800 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-300">Prediction</p>
              <p className="font-semibold text-slate-800 dark:text-white">
                {student.prediction === 1 ? 'Dropout' : 'No Dropout'}
              </p>
            </div>
            <div className="rounded-xl bg-white/60 dark:bg-slate-800 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-300">Rank</p>
              <p className="font-semibold text-slate-800 dark:text-white">#{student.rank}</p>
            </div>
          </div>

          {/* Input Details */}
          {student.input && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📊 Provided Data</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(student.input).map(([key, value]) => {
                  if (key.toLowerCase() === 'dropout') return null;
                  
                  const label = key === 'Age at enrollment' ? 'Age' : key === 'Sem1_SGPA' ? 'Sem 1 SGPA' : key === 'Sem2_SGPA' ? 'Sem 2 SGPA' : key.replace(/_/g, ' ');
                  let displayValue = value;
                  if (key === 'Gender') displayValue = value === 1 ? 'Male' : 'Female';
                  if (key === 'Attendance' && !isNaN(value)) displayValue = `${value}%`;
                  
                  return (
                    <div key={key} className="flex justify-between items-center bg-white/40 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-300">{label}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-white">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">🧠 Analysis</h3>
            <ul className="space-y-1.5">
              {explanations.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-0.5">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl bg-white/80 dark:bg-slate-800 p-4 border border-slate-200/50 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">💡 Recommendation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {student.recommendation || 'Continue monitoring student performance.'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
