import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';
import { RiskPieChart, TopRiskBarChart } from '../components/Charts';
import ResultsTable from '../components/ResultsTable';
import StudentModal from '../components/StudentModal';

export default function Dashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Load predictions from localStorage (set by batch upload or we generate demo data)
  const predictions = useMemo(() => {
    const stored = localStorage.getItem('predictions');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    // Demo data
    return [
      { id: 1, prediction: 1, probability: 0.92, risk_level: 'High Risk', rank: 1, recommendation: 'Immediate intervention required. Schedule counseling session.' },
      { id: 2, prediction: 1, probability: 0.84, risk_level: 'High Risk', rank: 2, recommendation: 'Assign academic mentor. Review attendance patterns.' },
      { id: 3, prediction: 1, probability: 0.71, risk_level: 'High Risk', rank: 3, recommendation: 'Check financial aid eligibility. Monitor closely.' },
      { id: 4, prediction: 0, probability: 0.55, risk_level: 'Medium Risk', rank: 4, recommendation: 'Regular check-ins recommended. Provide study resources.' },
      { id: 5, prediction: 0, probability: 0.48, risk_level: 'Medium Risk', rank: 5, recommendation: 'Monitor academic progress. Encourage participation.' },
      { id: 6, prediction: 0, probability: 0.35, risk_level: 'Medium Risk', rank: 6, recommendation: 'Periodic review. Ensure adequate support available.' },
      { id: 7, prediction: 0, probability: 0.22, risk_level: 'Low Risk', rank: 7, recommendation: 'Continue current support. Student performing well.' },
      { id: 8, prediction: 0, probability: 0.15, risk_level: 'Low Risk', rank: 8, recommendation: 'Student is on track. Maintain engagement.' },
      { id: 9, prediction: 0, probability: 0.08, risk_level: 'Low Risk', rank: 9, recommendation: 'No immediate concerns.' },
      { id: 10, prediction: 0, probability: 0.05, risk_level: 'Low Risk', rank: 10, recommendation: 'Excellent performance. Consider for peer mentoring.' },
    ];
  }, []);

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
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Predictions</h3>
        <ResultsTable data={predictions} onViewDetails={setSelectedStudent} />
      </motion.div>

      {/* Modal */}
      {selectedStudent && (
        <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
