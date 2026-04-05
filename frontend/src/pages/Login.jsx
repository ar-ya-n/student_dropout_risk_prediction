import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginUser(email.trim(), password);
      
      // Fetch role precisely to prevent UI flicker
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      let fetchedRole = "student";
      
      if (docSnap.exists()) {
        fetchedRole = docSnap.data().role;
      }
      
      if (fetchedRole === 'teacher') {
        navigate('/dashboard');
      } else {
        navigate('/student-portal');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-violet-900 p-4">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Dropout Insight</h1>
            <p className="text-sm text-slate-300 mt-1">AI-Powered Student Risk Analysis</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle */}
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-1.5 text-xs text-center font-semibold rounded-lg transition-all ${
                  role === 'student' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-1.5 text-xs text-center font-semibold rounded-lg transition-all ${
                  role === 'teacher' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Teacher
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 transition-all"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 transition-all"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-400 hover:to-violet-400 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-slate-300 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white font-semibold hover:text-primary-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
