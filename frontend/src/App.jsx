import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SinglePrediction from './pages/SinglePrediction';
import Dashboard from './pages/Dashboard';
import BatchUpload from './pages/BatchUpload';

function AuthGuard() {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/" replace />;
  return <AppLayout />;
}

function AppLayout() {
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predict" element={<SinglePrediction />} />
          <Route path="/upload" element={<BatchUpload />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
