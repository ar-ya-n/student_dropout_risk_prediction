import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserPredictions } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ResultsTable from '../components/ResultsTable';
import StudentModal from '../components/StudentModal';
import { Link } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StudentHabits from '../components/StudentHabits';

function riskStyles(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high'))
    return {
      bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-500 text-white shadow-red-500/30',
    };
  if (l.includes('medium'))
    return {
      bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500 text-white shadow-amber-500/30',
    };
  return {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-500 text-white shadow-emerald-500/30',
  };
}

export default function StudentPortal() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const data = await getUserPredictions(currentUser.uid);
        let formatted = data.map((p, index) => ({
          id: String(p.id).substring(0, 8),
          fullId: p.id,
          prediction: p.output?.prediction,
          probability: p.output?.probability || 0,
          risk_level: p.output?.risk_level || 'Unknown',
          recommendation: p.output?.recommendation || '',
          s_no: data.length - index,
          ...p
        }));

        // Apply visual ranking logic identical to Teacher dataset constraints
        const sortedByRisk = [...formatted].sort((a, b) => b.probability - a.probability);
        const rankMap = new Map();
        sortedByRisk.forEach((item, idx) => {
          rankMap.set(item.fullId, idx + 1);
        });
        
        formatted = formatted.map(item => ({
          ...item,
          rank: rankMap.get(item.fullId)
        }));

        // Sort chronologically for self-view default
        const sortedByTime = [...formatted].sort((a, b) => {
          const dateA = a.timestamp?.seconds || 0;
          const dateB = b.timestamp?.seconds || Date.now() / 1000; // fallback
          return dateB - dateA;
        });

        setHistory(sortedByTime);
      } catch (err) {
        console.error("Failed to fetch student history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [currentUser]);

  if (loading) return <Loader text="Loading your portal..." />;

  const latest = history.length > 0 ? history[0] : null;
  const latestStyle = latest ? riskStyles(latest.risk_level) : null;

  // Normalize current performance metrics onto a standard 0-10 scale
  const latestData = latest ? latest : null;
  const att = latestData?.Attendance || latestData?.input?.Attendance || latestData?.inputData?.Attendance || 0;
  const sem1 = latestData?.Sem1_SGPA || latestData?.input?.Sem1_SGPA || latestData?.inputData?.Sem1_SGPA || 0;
  const sem2 = latestData?.Sem2_SGPA || latestData?.input?.Sem2_SGPA || latestData?.inputData?.Sem2_SGPA || 0;
  const cgpa = latestData?.CGPA || latestData?.input?.CGPA || latestData?.inputData?.CGPA || 0;

  const chartData = [
    { name: 'Semester 1', value: sem1, color: '#3b82f6' },
    { name: 'Semester 2', value: sem2, color: '#8b5cf6' },
    { name: 'Current CGPA', value: cgpa, color: '#10b981' },
    { name: 'Attendance', value: att / 10, color: '#f59e0b' } // 85% transforms to 8.5
  ];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Portal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Welcome back. Track your academic risk trajectory here.
        </p>
      </div>

      {history.length === 0 ? (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-100 dark:border-slate-700/50 text-center shadow-lg"
        >
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Assessments Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Get started by evaluating your current academic performance. Our AI will analyze your standing and provide recommendations.
          </p>
          <Link
            to="/student-predict"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all"
          >
            Start Assessment
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Latest Prediction Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-3xl border p-8 mb-8 shadow-sm ${latestStyle.bg}`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Current Risk Trajectory</h2>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm ${latestStyle.badge}`}>
                    {latest.risk_level}
                  </span>
                  <div>
                    <span className={`text-2xl font-bold ${latestStyle.text}`}>
                      {(latest.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl max-w-sm w-full border border-slate-200/40 dark:border-slate-700/40">
                 <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Latest Recommendation</h3>
                 <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {latest.recommendation || "Maintain your current trajectory."}
                 </p>
              </div>
            </div>
          </motion.div>

          {/* Main Grid: Habits and Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
               <StudentHabits />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {/* Trends Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 h-full"
              >
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Current Academic Standing</h3>
                 
                 {latest ? (
                   <div className="h-64 mt-6">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} margin={{ top: 15, right: 20, bottom: 5, left: -20 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                         <YAxis axisLine={false} tickLine={false} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                         <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(val, name, props) => [
                               props.payload.name === 'Attendance' ? `${(val * 10).toFixed(1)}%` : val.toFixed(2),
                               props.payload.name === 'Attendance' ? 'Attendance' : 'Grade (Scale of 10)'
                            ]}
                         />
                         <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {chartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 ) : (
                   <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                     <p>Take an assessment to unlock your performance metrics!</p>
                   </div>
                 )}
              </motion.div>
            </div>
          </div>

          {/* History Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50"
          >
             <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Assessment History</h3>
             <ResultsTable data={history} onViewDetails={setSelectedSubmission} />
          </motion.div>
        </>
      )}

      {selectedSubmission && (
        <StudentModal student={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
      )}
    </div>
  );
}
