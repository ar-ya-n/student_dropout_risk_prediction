import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';
import { RiskPieChart, TopRiskBarChart } from '../components/Charts';
import ResultsTable from '../components/ResultsTable';
import StudentModal from '../components/StudentModal';
import { getUserPredictions } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function Dashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [predictions, setPredictions] = useState([]);
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

        // Replace the incorrect time-based rank with purely risk-based rank
        const sortedByRisk = [...formatted].sort((a, b) => b.probability - a.probability);
        const rankMap = new Map();
        sortedByRisk.forEach((item, idx) => {
          rankMap.set(item.fullId, idx + 1);
        });
        
        formatted = formatted.map(item => ({
          ...item,
          rank: rankMap.get(item.fullId)
        }));

        setPredictions(formatted);
      } catch (err) {
        console.error("Failed to fetch dashboard history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [currentUser]);

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  const high = predictions.filter((p) => p.risk_level === 'High Risk').length;
  const medium = predictions.filter((p) => p.risk_level === 'Medium Risk').length;
  const low = predictions.filter((p) => p.risk_level === 'Low Risk').length;

  const pieData = [
    { name: 'High Risk', value: high },
    { name: 'Medium Risk', value: medium },
    { name: 'Low Risk', value: low },
  ].filter((d) => d.value > 0);

  const topRisk = predictions
    .filter((p) => p.probability >= 0.4)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8)
    .map((p) => ({ id: `#${p.id}`, probability: p.probability }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Overview of student dropout risk analysis
        </p>
      </div>

      {/* Stat Cards */}
      {predictions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700/50 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No predictions yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Go to the Predict tab to make your first prediction.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Students" value={predictions.length} icon="👥" color="primary" />
            <StatCard label="High Risk" value={high} icon="🔴" color="red" />
            <StatCard label="Medium Risk" value={medium} icon="🟡" color="yellow" />
            <StatCard label="Low Risk" value={low} icon="🟢" color="green" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <RiskPieChart data={pieData} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <TopRiskBarChart data={topRisk} />
            </motion.div>
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50"
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Prediction History</h3>
            <ResultsTable data={predictions} onViewDetails={setSelectedStudent} />
          </motion.div>
        </>
      )}

      {/* Modal */}
      {selectedStudent && (
        <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
