import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import { Play, Square, MapPin, Navigation, Clock, Users, Route, AlertTriangle, Loader2, CheckCircle, Gauge } from 'lucide-react';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripActive, setTripActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    api.get('/users/me')
      .then(res => {
        setProfile(res.data);
        setTripActive(res.data.assignedBus?.tripActive || false);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load profile');
        setLoading(false);
      });

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTrip = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsError('');
    const socket = getSocket();

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? pos.coords.speed * 3.6 : 0, // m/s to km/h
          heading: pos.coords.heading || 0,
        };
        setCurrentLocation(loc);
        setSpeed(Math.round(loc.speed));

        // Emit to server
        if (socket) socket.emit('driver:update-location', loc);
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}`);
        // Simulate location for demo
        simulateLocation(socket);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    // Emit start trip
    if (socket) socket.emit('driver:start-trip');
    setTripActive(true);
  };

  // Simulate location movement for demo purposes
  const simulateLocation = (socket) => {
    const bus = profile?.assignedBus;
    if (!bus?.stops?.length) return;

    let stopIdx = 0;
    let progress = 0;

    intervalRef.current = setInterval(() => {
      if (stopIdx >= bus.stops.length - 1) {
        stopIdx = 0;
        progress = 0;
      }

      const from = bus.stops[stopIdx];
      const to = bus.stops[stopIdx + 1] || bus.stops[0];
      progress += 0.02;

      if (progress >= 1) {
        progress = 0;
        stopIdx++;
      }

      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;
      const simSpeed = 25 + Math.random() * 15;

      const loc = { lat, lng, speed: simSpeed, heading: 0 };
      setCurrentLocation(loc);
      setSpeed(Math.round(simSpeed));

      if (socket) socket.emit('driver:update-location', loc);
    }, 2000);
  };

  const stopTrip = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const socket = getSocket();
    if (socket) socket.emit('driver:stop-trip');

    setTripActive(false);
    setCurrentLocation(null);
    setSpeed(0);
  };

  const bus = profile?.assignedBus;

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar subtitle="Driver" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="mt-3 text-text-secondary">Loading driver dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar subtitle="Driver" />

      <main className="app-main max-w-content">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-text-primary">Driver dashboard</h2>
          <p className="text-text-secondary text-sm mt-1">Welcome, {profile?.name}. Manage your trip and share live location.</p>
        </div>

        {error && (
          <div className="error-banner mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Trip Control + Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Trip control */}
          <div className="sm:col-span-2 card p-5 animate-slide-up">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-3">Trip Control</p>
            <div className="flex items-center gap-4">
              {!tripActive ? (
                <button onClick={startTrip} className="btn-success flex items-center gap-2 text-lg py-4 px-8">
                  <Play className="w-6 h-6" />
                  Start Trip
                </button>
              ) : (
                <button onClick={stopTrip} className="btn-danger flex items-center gap-2 text-lg py-4 px-8 !bg-red-500/20 !border-red-500/40">
                  <Square className="w-6 h-6" />
                  Stop Trip
                </button>
              )}
              <div>
                <p className={`font-semibold ${tripActive ? 'text-success' : 'text-text-muted'}`}>
                  {tripActive ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                      Trip Active
                    </span>
                  ) : 'Trip Not Started'}
                </p>
                <p className="text-text-primary/30 text-xs mt-0.5">
                  {tripActive ? 'Sharing live GPS location' : 'Press Start to begin sharing location'}
                </p>
              </div>
            </div>
            {gpsError && (
              <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                {gpsError} — Using simulated location for demo.
              </div>
            )}
          </div>

          {/* Bus info */}
          <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Assigned Bus</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{bus?.number || 'N/A'}</p>
                <p className="text-text-muted text-xs mt-1">{bus?.route || 'No route'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Navigation className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Speed</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{tripActive ? speed : '--'} <span className="text-sm text-text-muted">km/h</span></p>
                <p className="text-text-muted text-xs mt-1">{tripActive ? 'Current speed' : 'Start trip to see speed'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Gauge className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Map + Stops */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 card p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-success" />
              Route Map
            </h3>
            <MapView
              height="450px"
              busLocations={currentLocation ? [{
                id: bus?.id, number: bus?.number,
                lat: currentLocation.lat, lng: currentLocation.lng,
                isActive: tripActive, speed: currentLocation.speed
              }] : []}
              stops={bus?.stops || []}
              routePath={bus?.stops ? bus.stops.map(s => [s.lat, s.lng]) : []}
              flyToPosition={currentLocation ? [currentLocation.lat, currentLocation.lng] : bus?.stops?.[0] ? [bus.stops[0].lat, bus.stops[0].lng] : null}
            />
          </div>

          {/* Stops list */}
          <div className="card p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              <Route className="w-4 h-4 text-success" />
              Pickup Stops ({bus?.stops?.length || 0})
            </h3>
            <div className="space-y-2">
              {(bus?.stops || []).map((stop, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-muted rounded-xl hover:bg-surface-muted transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-success text-xs font-bold">
                    {stop.order || i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary/80 text-sm font-medium">{stop.name}</p>
                    <p className="text-text-primary/30 text-xs">Stop #{stop.order || i + 1}</p>
                  </div>
                  <MapPin className="w-4 h-4 text-text-primary/20" />
                </div>
              ))}
            </div>

            {/* Student count */}
            <div className="mt-4 p-3 bg-surface-muted rounded-xl flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-text-primary/80 text-sm font-medium">Assigned Students</p>
                <p className="text-text-muted text-xs">{bus?.assignedStudents?.length || 0} students on this route</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
