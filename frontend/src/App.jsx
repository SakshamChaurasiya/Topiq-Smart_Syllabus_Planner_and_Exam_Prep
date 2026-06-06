// App.jsx — Router configuration
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Landing      from './pages/Landing';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import Subjects     from './pages/Subjects';
import SyllabusPage from './pages/SyllabusPage';
import PlannerPage  from './pages/PlannerPage';
import CheatCodePage from './pages/CheatCodePage';
import MissionsPage from './pages/MissionsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage  from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"        element={<Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — all inside the app layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/subjects"           element={<Subjects />} />
            <Route path="/subjects/:id/syllabus"  element={<SyllabusPage />} />
            <Route path="/subjects/:id/planner"   element={<PlannerPage />} />
            <Route path="/subjects/:id/cheatcode" element={<CheatCodePage />} />
            <Route path="/missions"           element={<MissionsPage />} />
            <Route path="/notifications"      element={<NotificationsPage />} />
            <Route path="/profile"            element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
