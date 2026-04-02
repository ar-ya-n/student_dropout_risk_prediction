import { useState } from 'react';
import { motion } from 'framer-motion';

function riskBadge(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high')) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (l.includes('medium')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
}

function rowBg(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high')) return 'bg-red-50/50 dark:bg-red-900/10';
  if (l.includes('medium')) return 'bg-amber-50/50 dark:bg-amber-900/10';
  return '';
}

export default function ResultsTable({ data, onViewDetails }) {
  const [sortKey, setSortKey] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState('');

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = data
    .filter(
      (r) =>
        String(r.id).includes(search) ||
        r.risk_level.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const SortIcon = ({ col }) =>
    sortKey === col ? (
      <span className="ml-1 text-xs">{sortAsc ? '▲' : '▼'}</span>
    ) : null;

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by ID or risk level..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-left">
              {[
                { key: 'id', label: 'ID' },
                { key: 'risk_level', label: 'Risk Level' },
                { key: 'probability', label: 'Probability' },
                { key: 'rank', label: 'Rank' },
                { key: null, label: 'Action' },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  className={`px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 ${
                    key ? 'cursor-pointer hover:text-primary-600' : ''
                  }`}
                  onClick={() => key && handleSort(key)}
                >
                  {label}
                  {key && <SortIcon col={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filtered.map((row, i) => (
              <motion.tr
                key={row.id + '-' + i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`${rowBg(row.risk_level)} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
              >
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.id}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${riskBadge(row.risk_level)}`}>
                    {row.risk_level}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {(row.probability * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">#{row.rank}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewDetails(row)}
                    className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-400">No results found</p>
        )}
      </div>
    </div>
  );
}
