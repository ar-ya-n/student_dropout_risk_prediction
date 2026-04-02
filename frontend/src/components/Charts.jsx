import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const RISK_COLORS = { 'High Risk': '#ef4444', 'Medium Risk': '#f59e0b', 'Low Risk': '#22c55e' };

export function RiskPieChart({ data }) {
  // data = [{ name: 'High Risk', value: 12 }, ...]
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(15,23,42,0.9)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[entry.name] }} />
            {entry.name} ({entry.value})
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomActiveBar = (props) => {
  const { x, y, width, height } = props;
  return (
    <rect 
      x={x - 4} 
      y={y - 4} 
      width={width + 8} 
      height={height + 4} 
      fill="#818cf8" 
      rx={6} 
    />
  );
};

export function TopRiskBarChart({ data }) {
  // data = [{ id: 1, probability: 0.92 }, ...]
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Top Risk Students</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 1]} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              background: 'rgba(15,23,42,0.9)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
            formatter={(v) => [(v * 100).toFixed(1) + '%', 'Probability']}
          />
          <Bar dataKey="probability" radius={[6, 6, 0, 0]} fill="#6366f1" activeBar={<CustomActiveBar />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
