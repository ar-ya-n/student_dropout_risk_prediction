import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePrediction from '../hooks/usePrediction';
import Loader from '../components/Loader';

const INITIAL = {
  Name: '',
  'Age at enrollment': '',
  Gender: '0',
  Sem1_SGPA: '',
  Sem2_SGPA: '',
  CGPA: '',
  Attendance: '',
  Backlogs: '',
};

function riskStyles(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high'))
    return {
      bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-500 text-white',
      glow: 'shadow-red-500/20',
    };
  if (l.includes('medium'))
    return {
      bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500 text-white',
      glow: 'shadow-amber-500/20',
    };
  return {
    bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500 text-white',
    glow: 'shadow-emerald-500/20',
  };
}

function generateExplanations(form, probability) {
  const reasons = [];
  const cgpa = parseFloat(form.CGPA);
  const attendance = parseFloat(form.Attendance);
  const backlogs = parseInt(form.Backlogs, 10);

  if (!isNaN(cgpa) && cgpa < 6.0) reasons.push('Low academic performance (CGPA below 6.0)');
  if (!isNaN(attendance) && attendance < 75) reasons.push('Poor attendance (below 75%)');
  if (!isNaN(backlogs) && backlogs > 0) reasons.push(`Student currently has ${backlogs} backlog(s)`);
  if (probability >= 0.7) reasons.push('Very high dropout probability detected by AI model');
  else if (probability >= 0.4) reasons.push('Moderate dropout risk flag from AI model');

  if (reasons.length === 0) reasons.push('Student profile appears healthy');
  return reasons;
}

const fieldConfig = [
  { name: 'Age at enrollment', label: 'Age at Enrollment', type: 'number', min: 10, max: 100, step: 1, placeholder: 'e.g. 19' },
  { name: 'Attendance', label: 'Attendance (%)', type: 'number', min: 0, max: 100, step: 0.1, placeholder: 'e.g. 85' },
  { name: 'Sem1_SGPA', label: 'Sem 1 SGPA', type: 'number', min: 0, max: 10, step: 0.01, placeholder: 'e.g. 7.5' },
  { name: 'Sem2_SGPA', label: 'Sem 2 SGPA', type: 'number', min: 0, max: 10, step: 0.01, placeholder: 'e.g. 7.2' },
  { name: 'CGPA', label: 'Cumulative GPA', type: 'number', min: 0, max: 10, step: 0.01, placeholder: 'e.g. 7.35' },
  { name: 'Backlogs', label: 'Backlogs', type: 'number', min: 0, step: 1, placeholder: 'e.g. 0' },
];

const dropdowns = [
  { name: 'Gender', label: 'Gender', options: [{ label: 'Female (0)', value: '0' }, { label: 'Male (1)', value: '1' }] },
];

export default function SinglePrediction() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const { result, loading, saving, saveSuccess, error, predict, reset } = usePrediction();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.Name || form.Name.trim() === '') errs.Name = 'Required';
    if (!form['Age at enrollment']) errs['Age at enrollment'] = 'Required';
    if (!form.Attendance || form.Attendance < 0 || form.Attendance > 100) errs.Attendance = '0-100';
    if (!form.Sem1_SGPA || form.Sem1_SGPA < 0) errs.Sem1_SGPA = 'Required';
    if (!form.Sem2_SGPA || form.Sem2_SGPA < 0) errs.Sem2_SGPA = 'Required';
    if (!form.CGPA || form.CGPA < 0) errs.CGPA = 'Required';
    if (form.Backlogs === '' || form.Backlogs < 0) errs.Backlogs = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const payload = {
      'Age at enrollment': parseInt(form['Age at enrollment'], 10),
      Gender: parseInt(form.Gender, 10),
      Sem1_SGPA: parseFloat(form.Sem1_SGPA),
      Sem2_SGPA: parseFloat(form.Sem2_SGPA),
      CGPA: parseFloat(form.CGPA),
      Attendance: parseFloat(form.Attendance),
      Backlogs: parseInt(form.Backlogs, 10),
    };
    const dbPayload = {
      Name: form.Name.trim(),
      ...payload
    };
    predict(payload, dbPayload);
  };

  const handleReset = () => {
    setForm(INITIAL);
    setErrors({});
    reset();
  };

  const styles = result ? riskStyles(result.risk_level) : null;
  const explanations = result ? generateExplanations(form, result.probability) : [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Single Student Prediction</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter student details to predict dropout risk using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-5">Student Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Student Name
              </label>
              <input
                type="text"
                name="Name"
                value={form.Name}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all ${errors.Name ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                  }`}
              />
              {errors.Name && (
                <p className="text-xs text-red-500 mt-1">{errors.Name}</p>
              )}
            </div>

            {/* Number fields */}
            <div className="grid grid-cols-2 gap-4">
              {fieldConfig.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    placeholder={f.placeholder}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all ${errors[f.name] ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                      }`}
                  />
                  {errors[f.name] && (
                    <p className="text-xs text-red-500 mt-1">{errors[f.name]}</p>
                  )}
                </div>
              ))}

              {/* Dropdowns */}
              {dropdowns.map((d) => (
                <div key={d.name}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {d.label}
                  </label>
                  <select
                    name={d.name}
                    value={form[d.name]}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  >
                    {d.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:from-primary-400 hover:to-violet-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Predict'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Reset
              </button>
            </div>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </motion.div>

        {/* Result */}
        <div className="min-h-[400px] flex flex-col w-full">
          {loading && !result && <div className="mx-auto mt-20"><Loader text="Running AI model..." /></div>}

          {saving && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 flex items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-600 dark:text-blue-400"
            >
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving prediction to history...
            </motion.div>
          )}

          {!saving && saveSuccess && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-center"
            >
              ✅ Prediction saved successfully!
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`w-full rounded-2xl border p-6 shadow-lg ${styles.glow} ${styles.bg}`}
              >
                {/* Risk header */}
                <div className="flex items-center gap-4 mb-6">
                  <span className={`px-5 py-2.5 rounded-xl text-lg font-bold ${styles.badge} shadow-md`}>
                    {result.risk_level}
                  </span>
                  <div>
                    <p className={`text-3xl font-bold ${styles.text}`}>
                      {(result.probability * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Dropout Probability</p>
                  </div>
                </div>

                {/* Prediction */}
                <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Model Prediction</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {result.prediction === 1 ? '⚠️ Dropout Likely' : '✅ No Dropout'}
                    </span>
                  </div>
                </div>

                {/* Explanations */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    🧠 Risk Factors
                  </h3>
                  <ul className="space-y-2">
                    {explanations.map((e, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <span className="text-primary-500 mt-0.5">▸</span>
                        <span>{e}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Recommendation */}
                <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    💡 Recommendation
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {result.recommendation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">🧍</span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Fill in the student details and click <strong>Predict Risk</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">Results will appear here</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
