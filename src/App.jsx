import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin
import AdminDashboard, { AdminHome } from './components/admin/AdminDashboard';
import ManageStudents from './components/admin/ManageStudents';
import ManageDrivers from './components/admin/ManageDrivers';
import ManageBuses from './components/admin/ManageBuses';
import ManageRoutes from './components/admin/ManageRoutes';
import LiveTracking from './components/admin/LiveTracking';
import SendNotification from './components/admin/SendNotification';

// Driver
import DriverDashboard from './components/driver/DriverDashboard';

// Student
import StudentDashboard from './components/student/StudentDashboard';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" style={{ width: 48, height: 48 }}></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />}
      />

      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <SignupPage />}
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="drivers" element={<ManageDrivers />} />
        <Route path="buses" element={<ManageBuses />} />
        <Route path="routes" element={<ManageRoutes />} />
        <Route path="tracking" element={<LiveTracking />} />
        <Route path="notifications" element={<SendNotification />} />
      </Route>

      {/* Driver Routes */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
