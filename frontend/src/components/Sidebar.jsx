import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logoutUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const teacherLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/predict', label: 'Predict', icon: '🧍' },
  { to: '/upload', label: 'Upload CSV', icon: '📤' }
];

const studentLinks = [
  { to: '/student-portal', label: 'My Portal', icon: '🎓' },
  { to: '/student-predict', label: 'Self Assessment', icon: '📝' }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const links = userRole === 'student' ? studentLinks : teacherLinks;

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar-dark text-white flex flex-col z-30">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
          Dropout Insight
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI-Powered Risk Analysis</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 shadow-lg shadow-primary-600/10'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex items-center gap-3 w-full"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
