import { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import LiveMap from '../maps/LiveMap';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { calculateETA, getBusStatusLabel, timeAgo } from '../../utils/helpers';

const studentLinks = [
  { path: '/student', label: 'Dashboard', icon: '📊', end: true }
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState(null);
  const [busLocations, setBusLocations] = useState([]);
  const [studentPos, setStudentPos] = useState(null);
  const [eta, setEta] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Fetch student profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/student/profile');
        setProfile(res.data.student);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/student/notifications');
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, []);

  // Get student's location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStudentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  // Poll bus location
  useEffect(() => {
    if (!profile?.assignedBus) return;

    const fetchBusLoc = async () => {
      try {
        const res = await api.get('/student/bus-location');
        const bus = res.data.bus;
        if (bus?.currentLocation?.lat) {
          setBusLocation(bus);
          setBusLocations([{
            busId: bus._id,
            busNumber: bus.busNumber,
            lat: bus.currentLocation.lat,
            lng: bus.currentLocation.lng,
            status: bus.status,
            driverName: bus.driver?.name || 'Driver',
            timestamp: bus.currentLocation.updatedAt
          }]);
        }
      } catch (err) {
        // No location yet
      }
    };

    fetchBusLoc();
    const interval = setInterval(fetchBusLoc, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !profile?.assignedBus?._id) return;

    const handleUpdate = (data) => {
      if (data.busId === profile.assignedBus._id) {
        setBusLocations([{
          busId: data.busId,
          busNumber: profile.assignedBus.busNumber,
          lat: data.lat,
          lng: data.lng,
          status: 'moving',
          driverName: profile.assignedBus.driver?.name || 'Driver',
          timestamp: data.timestamp
        }]);
        setBusLocation(prev => ({
          ...prev,
          currentLocation: { lat: data.lat, lng: data.lng, updatedAt: data.timestamp },
          status: 'moving'
        }));
      }
    };

    const handleOffline = (data) => {
      if (data.busId === profile.assignedBus._id) {
        setBusLocations([]);
        setBusLocation(prev => prev ? { ...prev, status: 'inactive' } : null);
      }
    };

    socket.on('bus:location-updated', handleUpdate);
    socket.on('bus:went-offline', handleOffline);

    return () => {
      socket.off('bus:location-updated', handleUpdate);
      socket.off('bus:went-offline', handleOffline);
    };
  }, [socket, profile]);

  // Calculate ETA
  useEffect(() => {
    if (busLocation?.currentLocation?.lat && studentPos?.lat) {
      const minutes = calculateETA(
        busLocation.currentLocation.lat,
        busLocation.currentLocation.lng,
        studentPos.lat,
        studentPos.lng
      );
      setEta(minutes);
    }
  }, [busLocation, studentPos]);

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner text="Loading student dashboard..." />
      </div>
    );
  }

  const bus = profile?.assignedBus;
  const route = bus?.route;
  const driver = bus?.driver;

  return (
    <div className="app-layout">
      <Sidebar links={studentLinks} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar title="Student Panel" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Welcome, {user?.name} 👋</h2>
          {user?.erpId && <span className="badge badge-cyan">ERP: {user.erpId}</span>}
        </div>

        {/* Info Cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-title">Assigned Bus</div>
            <div className="info-card-value cyan">{bus?.busNumber || 'Not assigned'}</div>
            {bus && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {getBusStatusLabel(busLocation?.status || bus?.status || 'inactive')}
              </p>
            )}
          </div>

          <div className="info-card">
            <div className="info-card-title">Pickup → Drop</div>
            <div className="info-card-value purple" style={{ fontSize: '1rem' }}>
              📍 {profile?.pickupPoint || '—'}
            </div>
            <div className="info-card-value green" style={{ fontSize: '1rem', marginTop: '4px' }}>
              🏁 {profile?.dropPoint || '—'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-title">Estimated Arrival</div>
            {eta ? (
              <div className="eta-display">
                <span className="eta-number">{eta}</span>
                <span className="eta-unit">min</span>
              </div>
            ) : (
              <div className="info-card-value" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {busLocations.length > 0 ? 'Calculating...' : 'Bus offline'}
              </div>
            )}
          </div>

          <div className="info-card">
            <div className="info-card-title">Route</div>
            <div className="info-card-value" style={{ fontSize: '0.95rem' }}>
              {route?.name || 'No route assigned'}
            </div>
            {route && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {route.stops?.length || 0} stops
              </p>
            )}
          </div>
        </div>

        {/* Driver Contact */}
        {driver && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Driver Contact</h3>
              <span className={`badge ${driver.isOnline ? 'badge-green' : 'badge-gray'}`}>
                <span className={`status-dot ${driver.isOnline ? 'online' : 'offline'}`}></span>
                {driver.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="driver-contact">
              <div className="driver-contact-avatar">👤</div>
              <div className="driver-contact-info">
                <h4>{driver.name}</h4>
                <p>📞 {driver.phone || 'N/A'} &nbsp;•&nbsp; ✉️ {driver.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">🗺️ Live Bus Tracking</h3>
            {busLocations.length > 0 && (
              <span className="badge badge-green">
                <span className="status-dot online"></span> Live
              </span>
            )}
          </div>
          <LiveMap
            busLocations={busLocations}
            routeStops={route?.stops || []}
            studentLocation={studentPos}
            className="large"
          />
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔔 Notifications</h3>
            <span className="badge badge-cyan">{notifications.length}</span>
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔕</div>
              <h3>No notifications</h3>
              <p>You'll see bus updates and alerts here</p>
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.slice(0, 10).map((n) => (
                <div key={n._id} className="notification-item">
                  <h5>{n.title}</h5>
                  <p>{n.message}</p>
                  <div className="time">{timeAgo(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
