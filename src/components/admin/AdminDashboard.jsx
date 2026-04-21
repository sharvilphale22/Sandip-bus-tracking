import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/students', label: 'Students', icon: '🎓' },
  { path: '/admin/drivers', label: 'Drivers', icon: '👤' },
  { path: '/admin/buses', label: 'Buses', icon: '🚌' },
  { path: '/admin/routes', label: 'Routes', icon: '🗺️' },
  { path: '/admin/tracking', label: 'Live Tracking', icon: '📡' },
  { path: '/admin/notifications', label: 'Notifications', icon: '🔔' }
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        links={adminLinks}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Navbar
        title="Admin Panel"
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

// Dashboard Home (stats overview)
export function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard Overview</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cyan">🎓</div>
          <div className="stat-info">
            <h3>{stats?.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">👤</div>
          <div className="stat-info">
            <h3>{stats?.totalDrivers || 0}</h3>
            <p>Total Drivers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🚌</div>
          <div className="stat-info">
            <h3>{stats?.totalBuses || 0}</h3>
            <p>Total Buses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📡</div>
          <div className="stat-info">
            <h3>{stats?.activeBuses || 0}</h3>
            <p>Active Buses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink">🗺️</div>
          <div className="stat-info">
            <h3>{stats?.totalRoutes || 0}</h3>
            <p>Total Routes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🟢</div>
          <div className="stat-info">
            <h3>{stats?.onlineDrivers || 0}</h3>
            <p>Online Drivers</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/admin/students" className="btn btn-primary">➕ Add Student</a>
          <a href="/admin/drivers" className="btn btn-secondary">➕ Add Driver</a>
          <a href="/admin/buses" className="btn btn-secondary">➕ Add Bus</a>
          <a href="/admin/tracking" className="btn btn-success">📡 Live Tracking</a>
          <a href="/admin/notifications" className="btn btn-warning">🔔 Send Alert</a>
        </div>
      </div>
    </div>
  );
}
