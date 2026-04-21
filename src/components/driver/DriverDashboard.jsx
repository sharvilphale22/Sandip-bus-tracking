import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import LiveMap from '../maps/LiveMap';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { getBusStatusLabel } from '../../utils/helpers';

const driverLinks = [
  { path: '/driver', label: 'Dashboard', icon: '📊', end: true }
];

export default function DriverDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [busLocation, setBusLocation] = useState([]);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch driver profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/driver/profile');
        setProfile(res.data.driver);
        setIsOnline(res.data.driver?.isOnline || false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Toggle online/offline
  const toggleStatus = async () => {
    const newStatus = !isOnline;
    try {
      await api.put('/driver/status', { isOnline: newStatus });
      setIsOnline(newStatus);
      if (!newStatus && isSharing) {
        stopSharing();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start sharing location
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    if (!profile?.assignedBus?._id) {
      alert('No bus assigned to you. Contact admin.');
      return;
    }

    const busId = profile.assignedBus._id;

    // Notify server
    if (socket) {
      socket.emit('driver:start-sharing', { busId });
    }

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude });

        setBusLocation([{
          busId,
          busNumber: profile.assignedBus.busNumber,
          lat: latitude,
          lng: longitude,
          status: 'moving',
          driverName: user?.name || 'You',
          timestamp: new Date()
        }]);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable GPS permissions.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    // Send location updates every 3 seconds
    intervalRef.current = setInterval(() => {
      if (currentPos && socket) {
        socket.emit('driver:location-update', {
          lat: currentPos.lat,
          lng: currentPos.lng,
          busId
        });
      }
    }, 3000);

    setIsSharing(true);
    if (!isOnline) {
      toggleStatus();
    }
  }, [profile, socket, currentPos, isOnline, user]);

  // Also send via socket when currentPos changes
  useEffect(() => {
    if (isSharing && currentPos && socket && profile?.assignedBus?._id) {
      socket.emit('driver:location-update', {
        lat: currentPos.lat,
        lng: currentPos.lng,
        busId: profile.assignedBus._id
      });
    }
  }, [currentPos, isSharing, socket, profile]);

  // Stop sharing
  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (socket && profile?.assignedBus?._id) {
      socket.emit('driver:stop-sharing', { busId: profile.assignedBus._id });
    }

    setIsSharing(false);
    setBusLocation([]);
  }, [socket, profile]);

  // Emergency alert
  const sendEmergency = async () => {
    if (!confirm('🚨 Send emergency alert? This will notify all admins and students.')) return;
    try {
      await api.post('/driver/emergency', {
        message: 'Emergency! Bus needs immediate assistance.'
      });
      if (socket && profile?.assignedBus?._id) {
        socket.emit('driver:emergency', {
          busId: profile.assignedBus._id,
          message: 'Emergency! Bus needs immediate assistance.'
        });
      }
      alert('Emergency alert sent!');
    } catch (err) {
      alert('Failed to send emergency alert');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner text="Loading driver dashboard..." />
      </div>
    );
  }

  const bus = profile?.assignedBus;
  const route = bus?.route;

  return (
    <div className="app-layout">
      <Sidebar links={driverLinks} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar title="Driver Panel" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Welcome, {user?.name} 👋</h2>
        </div>

        {/* Status Controls */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="driver-status-section">
            <div className="status-toggle">
              <label className="toggle-switch">
                <input type="checkbox" checked={isOnline} onChange={toggleStatus} />
                <span className="toggle-slider"></span>
              </label>
              <span className={`status-label ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </span>
            </div>

            {!isSharing ? (
              <button className="btn btn-success btn-lg" onClick={startSharing} id="start-sharing-btn">
                📍 Start Sharing Location
              </button>
            ) : (
              <button className="btn btn-warning btn-lg" onClick={stopSharing} id="stop-sharing-btn">
                ⏹️ Stop Sharing
              </button>
            )}

            <button className="emergency-btn" onClick={sendEmergency} id="emergency-btn">
              🚨 Emergency
            </button>

            {isSharing && (
              <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                <span className="status-dot online"></span>
                Broadcasting Live
              </span>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-title">Assigned Bus</div>
            <div className="info-card-value cyan">{bus?.busNumber || 'Not assigned'}</div>
            {bus && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{bus.licensePlate} • Capacity: {bus.capacity}</p>}
          </div>
          <div className="info-card">
            <div className="info-card-title">Route</div>
            <div className="info-card-value purple">{route?.name || 'Not assigned'}</div>
            {route && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{route.stops?.length || 0} stops</p>}
          </div>
          <div className="info-card">
            <div className="info-card-title">Bus Status</div>
            <div className="info-card-value green">
              {isSharing ? '🚌 Moving' : isOnline ? '🟢 Active' : '⚫ Inactive'}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-title">Current Position</div>
            <div className="info-card-value" style={{ fontSize: '0.9rem' }}>
              {currentPos
                ? `${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)}`
                : 'Not available'}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">🗺️ {isSharing ? 'Live Location' : 'Route Map'}</h3>
          </div>
          <LiveMap
            busLocations={busLocation}
            routeStops={route?.stops || []}
            className="large"
            center={currentPos ? [currentPos.lat, currentPos.lng] : undefined}
          />
        </div>
      </main>
    </div>
  );
}
