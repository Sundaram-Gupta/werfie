import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import UsersPage from '@/pages/users';
import PostsPage from '@/pages/posts';
import ReportsPage from '@/pages/reports';
import CommunitiesPage from '@/pages/communities';
import AdsPage from '@/pages/ads';
import AnalyticsPage from '@/pages/analytics';
import SettingsPage from '@/pages/settings';
import AppealsPage from '@/pages/appeals';
import VerificationPage from '@/pages/verification';
import ConfigPage from '@/pages/config';
import NotificationsPage from '@/pages/notifications';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/ads" element={<AdsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/appeals" element={<AppealsPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
