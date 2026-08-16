import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, Loader2, MapPinOff } from 'lucide-react';

const PRIMARY = '#4f46e5';
const STOP_BORDER = '#4f46e5';

const createBusIcon = (isActive = true) => {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        ${isActive ? `<div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${PRIMARY}22;"></div>` : ''}
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${isActive ? PRIMARY : '#94a3b8'};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(15,23,42,0.2);
          border:2.5px solid white;font-size:16px;z-index:10;
        ">🚌</div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
};

const createStopIcon = (order, isUserStop = false) => {
  const bg = isUserStop ? PRIMARY : '#ffffff';
  const color = isUserStop ? '#ffffff' : PRIMARY;
  const border = isUserStop ? PRIMARY : STOP_BORDER;
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width:22px;height:22px;border-radius:50%;
        background:${bg};border:2px solid ${border};
        display:flex;align-items:center;justify-content:center;
        font-size:9px;font-weight:700;color:${color};
        box-shadow:0 1px 4px rgba(15,23,42,0.15);
      ">${order}</div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
};

function FlyToPosition({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 14, { duration: 1 });
    }
  }, [position, zoom, map]);
  return null;
}

function RecenterControl({ position, zoom }) {
  const map = useMap();
  if (!position) return null;

  return (
    <button
      type="button"
      onClick={() => map.flyTo(position, zoom || 14, { duration: 0.8 })}
      className="absolute bottom-3 right-3 z-[1000] w-11 h-11 rounded-md bg-surface border border-border shadow-md flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
      aria-label="Recenter map on bus"
      style={{ background: 'var(--color-surface)' }}
    >
      <LocateFixed className="w-5 h-5" />
    </button>
  );
}

export default function MapView({
  center = [19.9975, 73.7898],
  zoom = 13,
  busLocations = [],
  stops = [],
  routePath = [],
  flyToPosition = null,
  height = '360px',
  className = '',
  loading = false,
  unavailable = false,
  unavailableMessage = 'Map unavailable',
  userStopName = null,
  autoFly = true,
}) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const busPosition = busLocations[0]
    ? [busLocations[0].lat, busLocations[0].lng]
    : null;
  const recenterTarget = busPosition || flyToPosition;

  if (unavailable) {
    return (
      <div
        className={`rounded-md border border-border bg-surface-muted flex flex-col items-center justify-center gap-2 ${className}`}
        style={{ height }}
        role="img"
        aria-label={unavailableMessage}
      >
        <MapPinOff className="w-8 h-8 text-text-muted" />
        <p className="text-sm text-text-secondary">{unavailableMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative rounded-md overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      {(loading || !ready) && (
        <div className="absolute inset-0 z-[1001] bg-surface-muted flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Loading map…</p>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {autoFly && flyToPosition && <FlyToPosition position={flyToPosition} zoom={zoom} />}

        <RecenterControl position={recenterTarget} zoom={zoom} />

        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: PRIMARY,
              weight: 4,
              opacity: 0.75,
            }}
          />
        )}

        {stops.map((stop, i) => (
          <Marker
            key={`stop-${stop.name}-${i}`}
            position={[stop.lat, stop.lng]}
            icon={createStopIcon(stop.order || i + 1, stop.name === userStopName)}
          >
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Stop #{stop.order || i + 1}
              </span>
            </Popup>
          </Marker>
        ))}

        {busLocations.map((bus) => (
          <Marker
            key={`bus-${bus.id}`}
            position={[bus.lat, bus.lng]}
            icon={createBusIcon(bus.isActive)}
          >
            <Popup>
              <strong>Bus {bus.number || bus.id}</strong>
              <br />
              <span style={{ fontSize: '12px', color: bus.isActive ? '#059669' : '#94a3b8' }}>
                {bus.isActive ? '● On route' : '● Idle'}
              </span>
              {bus.speed !== undefined && (
                <>
                  <br />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Speed: {Math.round(bus.speed)} km/h
                  </span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
