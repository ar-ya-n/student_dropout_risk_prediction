import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SinglePrediction from './pages/SinglePrediction';
import Dashboard from './pages/Dashboard';
import BatchUpload from './pages/BatchUpload';
import StudentPortal from './pages/StudentPortal';
import StudentPredict from './pages/StudentPredict';
import { AuthProvider, useAuth } from './context/AuthContext';

function RoleRoute({ role, children }) {
  const { currentUser, userRole, loading } = useAuth();
  
  // Wait until auth and role pull concludes
  if (loading) return null; 
  
  if (!currentUser) return <Navigate to="/" replace />;
  if (userRole !== role) {
    console.warn(`Role mismatch: Expected ${role}, got ${userRole}`);
    return <Navigate to={userRole === 'teacher' ? '/dashboard' : '/student-portal'} replace />;
  }
  return children;
}

function TeacherLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StudentLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Teacher/Admin Routes */}
          <Route element={<RoleRoute role="teacher"><TeacherLayout /></RoleRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predict" element={<SinglePrediction />} />
            <Route path="/upload" element={<BatchUpload />} />
          </Route>

          {/* Student Routes */}
          <Route element={<RoleRoute role="student"><StudentLayout /></RoleRoute>}>
            <Route path="/student-portal" element={<StudentPortal />} />
            <Route path="/student-predict" element={<StudentPredict />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
