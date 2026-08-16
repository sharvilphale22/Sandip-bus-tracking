import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import LiveBusCard from '../components/LiveBusCard';
import MapView from '../components/MapView';
import RouteTimeline from '../components/RouteTimeline';
import NotificationBell from '../components/NotificationBell';
import {
  Sun, Moon, MapPin, AlertTriangle, RefreshCw, User, Bus,
  Clock, Bell, Info, AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { formatRelativeTime, getFriendlyError } from '../utils/format';

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-6 w-48" />
      <div className="skeleton h-10 w-full rounded-md" />
      <div className="card-raised p-4 space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-12 w-24 mx-auto" />
        <div className="skeleton h-4 w-full" />
      </div>
      <div className="skeleton h-[320px] w-full rounded-md" />
    </div>
  );
}

function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => setError('Unable to load notifications'))
      .finally(() => setLoading(false));

    const socket = getSocket();
    if (socket) {
      socket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
      });
    }
    return () => { if (socket) socket.off('notification'); };
  }, []);

  const formatTime = (ts) => formatRelativeTime(new Date(ts).getTime()) || 'Just now';

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4"><div className="skeleton h-4 w-full mb-2" /><div className="skeleton h-3 w-24" /></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="card p-8 text-center">
        <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium text-text-primary">No notifications</p>
        <p className="text-xs text-text-muted mt-1">Bus alerts and updates will appear here.</p>
      </div>
    );
  }

  const typeIcons = { info: Info, warning: AlertTriangle, delay: Clock, arrival: Bus };

  return (
    <ul className="space-y-2" aria-label="Notifications">
      {notifications.map((notif, i) => {
        const Icon = typeIcons[notif.type] || Info;
        return (
          <li key={notif.id || i} className="card p-4 flex gap-3">
            <div className="w-9 h-9 rounded-md bg-info-bg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-text-primary leading-relaxed">{notif.message}</p>
              <p className="text-xs text-text-muted mt-1">{formatTime(notif.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProfilePanel({ profile, onLogout }) {
  const bus = profile?.assignedBus;
  return (
    <div className="space-y-4">
      <div className="card-raised p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
          {profile?.name?.charAt(0) || '?'}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{profile?.name}</h2>
          <p className="text-sm text-text-secondary">{profile?.erpId}</p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Your bus</h3>
        <div className="flex items-center gap-3">
          <Bus className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-text-primary">Bus {bus?.number || 'Not assigned'}</p>
            <p className="text-xs text-text-muted">{bus?.route || 'No route'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-text-primary">{profile?.pickupStop || '—'}</p>
            <p className="text-xs text-text-muted">Pickup stop</p>
          </div>
        </div>
      </div>

      <button type="button" onClick={onLogout} className="btn-secondary w-full text-error border-error/30">
        Log out
      </button>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [etas, setEtas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tripActive, setTripActive] = useState(false);
  const [routeMode, setRouteMode] = useState('morning');
  const [notifCount, setNotifCount] = useState(0);

  const loadProfile = () => {
    setLoading(true);
    setError('');
    return api.get('/users/me')
      .then(res => {
        setProfile(res.data);
        if (res.data.assignedBus?.tripActive) setTripActive(true);
      })
      .catch(() => setError('Unable to load your bus information. Check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();

    api.get('/notifications')
      .then(res => setNotifCount(res.data.filter(n => !n.read).length))
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.on('bus:location-update', (data) => {
        setBusLocation({ lat: data.lat, lng: data.lng, speed: data.speed });
        setLastUpdated(data.timestamp || Date.now());
        if (data.etas) setEtas(data.etas);
        setTripActive(true);
      });
      socket.on('bus:trip-started', () => setTripActive(true));
      socket.on('bus:trip-ended', () => {
        setTripActive(false);
        setBusLocation(null);
        setEtas([]);
        setLastUpdated(null);
      });
      socket.on('notification', () => setNotifCount(c => c + 1));
    }

    return () => {
      if (socket) {
        socket.off('bus:location-update');
        socket.off('bus:trip-started');
        socket.off('bus:trip-ended');
        socket.off('notification');
      }
    };
  }, []);

  const bus = profile?.assignedBus;
  const myStopName = profile?.pickupStop;
  const myStopEta = etas.find(e => e.stopName === myStopName);
  const etaValue = myStopEta?.eta ?? null;

  const displayStops = routeMode === 'evening'
    ? [...(bus?.stops || [])].reverse().map((s, i) => ({ ...s, order: i + 1 }))
    : (bus?.stops || []);

  const nextStop = (() => {
    if (!tripActive || !etas.length) return null;
    const upcoming = displayStops.find(s => {
      const e = etas.find(x => x.stopName === s.name);
      return e && e.eta > 0;
    });
    return upcoming?.name || null;
  })();

  const pickupLabel = routeMode === 'morning'
    ? (profile?.pickupLocation || profile?.pickupStop)
    : 'College Campus (Main)';
  const dropLabel = routeMode === 'morning'
    ? 'College Campus (Main)'
    : (profile?.pickupLocation || profile?.pickupStop);

  const mapBusLocations = busLocation
    ? [{ id: bus?.id, number: bus?.number, lat: busLocation.lat, lng: busLocation.lng, isActive: tripActive, speed: busLocation.speed }]
    : [];

  const mapFlyTo = busLocation
    ? [busLocation.lat, busLocation.lng]
    : displayStops[0]
      ? [displayStops[0].lat, displayStops[0].lng]
      : null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'notifications') setNotifCount(0);
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar subtitle="Live tracking" actions={<NotificationBell />} />
        <main className="app-main app-main-with-nav max-w-content">
          <HomeSkeleton />
        </main>
        <BottomNav active="home" onChange={() => {}} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        subtitle={activeTab === 'home' ? 'Live tracking' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        actions={activeTab !== 'notifications' ? <NotificationBell /> : null}
        showLogout={activeTab !== 'profile'}
      />

      <main className="app-main app-main-with-nav max-w-content">
        {error && (
          <div className="error-banner mb-4" role="alert">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              <p>{getFriendlyError(error)}</p>
            </div>
            <button type="button" onClick={loadProfile} className="btn-ghost text-sm py-1 px-2 min-h-0">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Hi, {profile?.name?.split(' ')[0] || user?.name}
              </h2>
              <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {pickupLabel || 'Your pickup location'}
              </p>
            </div>

            {/* Route toggle */}
            <div className="flex p-1 bg-surface-muted rounded-md border border-border" role="group" aria-label="Route direction">
              <button
                type="button"
                onClick={() => setRouteMode('morning')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-sm text-sm font-medium min-h-[44px] transition-colors ${
                  routeMode === 'morning' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted'
                }`}
              >
                <Sun className="w-4 h-4" /> Morning
              </button>
              <button
                type="button"
                onClick={() => setRouteMode('evening')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-sm text-sm font-medium min-h-[44px] transition-colors ${
                  routeMode === 'evening' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted'
                }`}
              >
                <Moon className="w-4 h-4" /> Evening
              </button>
            </div>

            <LiveBusCard
              busNumber={bus?.number}
              route={`${pickupLabel} → ${dropLabel}`}
              eta={etaValue}
              tripActive={tripActive}
              lastUpdated={lastUpdated}
              nextStop={nextStop}
              pickupStop={myStopName}
              onViewMap={() => setActiveTab('track')}
            />

            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3">
                <p className="text-xs text-text-muted">Distance to stop</p>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {tripActive && myStopEta ? `${myStopEta.distance} km` : '—'}
                </p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-text-muted">Route</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5 truncate">{bus?.route || '—'}</p>
              </div>
            </div>

            {/* Map preview */}
            <section aria-label="Live map preview">
              <div className="flex items-center justify-between mb-2">
                <h3 className="section-title text-base">Live map</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className="text-sm text-primary font-medium min-h-[44px] px-2"
                >
                  Full screen
                </button>
              </div>
              <MapView
                height="min(380px, 45vh)"
                busLocations={mapBusLocations}
                stops={displayStops}
                routePath={displayStops.map(s => [s.lat, s.lng])}
                flyToPosition={mapFlyTo}
                userStopName={myStopName}
                unavailable={!bus}
                unavailableMessage="No bus assigned"
                autoFly={!!busLocation}
              />
              {!tripActive && bus && (
                <p className="text-xs text-text-muted text-center mt-2">
                  Bus location will appear when the trip starts
                </p>
              )}
            </section>
          </div>
        )}

        {/* TRACK */}
        {activeTab === 'track' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Live tracking</h2>
              <p className="text-sm text-text-secondary">Bus {bus?.number || '—'} · {bus?.route || 'No route'}</p>
            </div>
            <MapView
              height="min(420px, 55vh)"
              busLocations={mapBusLocations}
              stops={displayStops}
              routePath={displayStops.map(s => [s.lat, s.lng])}
              flyToPosition={mapFlyTo}
              userStopName={myStopName}
              unavailable={!bus}
              unavailableMessage="No bus assigned to track"
              autoFly={!!busLocation}
            />
            {tripActive && myStopEta && (
              <div className="card p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-text-muted">ETA</p>
                  <p className="text-lg font-semibold text-text-primary">{myStopEta.eta > 0 ? `${myStopEta.eta} min` : 'Arrived'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Distance</p>
                  <p className="text-lg font-semibold text-text-primary">{myStopEta.distance} km</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Updated</p>
                  <p className="text-sm font-semibold text-text-primary">{lastUpdated ? formatRelativeTime(lastUpdated) : '—'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROUTES */}
        {activeTab === 'routes' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Route</h2>
              <p className="text-sm text-text-secondary">{pickupLabel} → {dropLabel}</p>
            </div>
            <div className="flex p-1 bg-surface-muted rounded-md border border-border mb-2">
              <button type="button" onClick={() => setRouteMode('morning')} className={`flex-1 py-2.5 text-sm font-medium min-h-[44px] rounded-sm ${routeMode === 'morning' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted'}`}>Morning</button>
              <button type="button" onClick={() => setRouteMode('evening')} className={`flex-1 py-2.5 text-sm font-medium min-h-[44px] rounded-sm ${routeMode === 'evening' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted'}`}>Evening</button>
            </div>
            <RouteTimeline
              stops={displayStops}
              etas={etas}
              tripActive={tripActive}
              myStopName={myStopName}
              routeMode={routeMode}
            />
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
            <NotificationsPanel />
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Profile</h2>
            <ProfilePanel profile={profile} onLogout={logout} />
          </div>
        )}
      </main>

      <BottomNav
        active={activeTab}
        onChange={handleTabChange}
        notificationCount={notifCount}
      />
    </div>
  );
}
