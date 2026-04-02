import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon, color = 'primary' }) {
  const colorMap = {
    primary: 'from-primary-500 to-primary-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-amber-500 to-amber-600',
    green: 'from-emerald-500 to-emerald-600',
  };

  const bgMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    yellow: 'bg-amber-50 dark:bg-amber-900/20',
    green: 'bg-emerald-50 dark:bg-emerald-900/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgMap[color]} flex items-center justify-center`}>
          <span
            className={`text-lg font-bold bg-gradient-to-br ${colorMap[color]} bg-clip-text text-transparent`}
          >
            {icon}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
