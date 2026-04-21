import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import LiveMap from '../maps/LiveMap';
import LoadingSpinner from '../common/LoadingSpinner';
import { getBusStatusLabel } from '../../utils/helpers';

export default function LiveTracking() {
  const { socket } = useSocket();
  const [buses, setBuses] = useState([]);
  const [busLocations, setBusLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await api.get('/admin/buses');
        setBuses(res.data.buses);

        // Initialize bus locations from stored data
        const locs = res.data.buses
          .filter(b => b.currentLocation?.lat && b.currentLocation?.lng)
          .map(b => ({
            busId: b._id,
            busNumber: b.busNumber,
            lat: b.currentLocation.lat,
            lng: b.currentLocation.lng,
            status: b.status,
            driverName: b.driver?.name || 'N/A',
            timestamp: b.currentLocation.updatedAt
          }));
        setBusLocations(locs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  // Listen for real-time location updates
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      setBusLocations(prev => {
        const existing = prev.findIndex(b => b.busId === data.busId);
        const busInfo = buses.find(b => b._id === data.busId);

        const updated = {
          busId: data.busId,
          busNumber: busInfo?.busNumber || 'Bus',
          lat: data.lat,
          lng: data.lng,
          status: 'moving',
          driverName: busInfo?.driver?.name || 'Driver',
          timestamp: data.timestamp
        };

        if (existing >= 0) {
          const newLocs = [...prev];
          newLocs[existing] = updated;
          return newLocs;
        }
        return [...prev, updated];
      });
    };

    const handleBusOffline = (data) => {
      setBusLocations(prev => prev.filter(b => b.busId !== data.busId));
    };

    socket.on('bus:location-updated', handleLocationUpdate);
    socket.on('bus:went-offline', handleBusOffline);

    return () => {
      socket.off('bus:location-updated', handleLocationUpdate);
      socket.off('bus:went-offline', handleBusOffline);
    };
  }, [socket, buses]);

  if (loading) return <LoadingSpinner text="Loading live tracking..." />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📡 Live Bus Tracking</h2>
        <span className="badge badge-green">
          <span className="status-dot online"></span>
          {busLocations.length} bus{busLocations.length !== 1 ? 'es' : ''} active
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <LiveMap
          busLocations={busLocations}
          className="fullscreen"
        />
      </div>

      {busLocations.length > 0 && (
        <div className="stats-grid" style={{ marginTop: '20px' }}>
          {busLocations.map((b) => (
            <div className="stat-card" key={b.busId}>
              <div className="stat-icon cyan">🚌</div>
              <div className="stat-info">
                <h3 style={{ fontSize: '1.1rem' }}>{b.busNumber}</h3>
                <p>{getBusStatusLabel(b.status)}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Driver: {b.driverName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
