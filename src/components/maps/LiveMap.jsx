import { useEffect, useRef } from 'react';
import L from 'leaflet';

const DEFAULT_CENTER = [20.0432, 73.7855]; // Sandip College, Nashik
const DEFAULT_ZOOM = 13;

// Custom bus icon
const createBusIcon = (isMoving = false) => {
  return L.divIcon({
    className: 'bus-marker-icon',
    html: `<div style="
      font-size: 28px;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      transition: transform 0.3s ease;
      ${isMoving ? 'animation: bounce 1s infinite;' : ''}
    ">🚌</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
};

// Custom stop icon
const createStopIcon = (order) => {
  return L.divIcon({
    className: 'bus-marker-icon',
    html: `<div style="
      width: 24px; height: 24px;
      background: linear-gradient(135deg, #7c3aed, #00d4ff);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: white;
      border: 2px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${order}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16]
  });
};

// Student location icon
const studentIcon = L.divIcon({
  className: 'bus-marker-icon',
  html: `<div style="
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
  ">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -28]
});

export default function LiveMap({
  busLocations = [],
  routeStops = [],
  studentLocation = null,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  onMapReady = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkersRef = useRef({});
  const stopMarkersRef = useRef([]);
  const studentMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    if (onMapReady) onMapReady(map);

    // Fix map size on next frame
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update bus markers with smooth animation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentIds = new Set();

    busLocations.forEach((bus) => {
      if (!bus.lat || !bus.lng) return;
      currentIds.add(bus.busId || bus._id);

      const id = bus.busId || bus._id;
      const existingMarker = busMarkersRef.current[id];

      if (existingMarker) {
        // Smooth animation to new position
        const start = existingMarker.getLatLng();
        const end = L.latLng(bus.lat, bus.lng);
        const duration = 2000;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out quad
          const eased = 1 - (1 - progress) * (1 - progress);

          const lat = start.lat + (end.lat - start.lat) * eased;
          const lng = start.lng + (end.lng - start.lng) * eased;

          existingMarker.setLatLng([lat, lng]);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
        existingMarker.setIcon(createBusIcon(bus.status === 'moving'));

        // Update popup
        existingMarker.setPopupContent(`
          <h4>${bus.busNumber || 'Bus'}</h4>
          <p><strong>Status:</strong> ${bus.status || 'Active'}</p>
          <p><strong>Driver:</strong> ${bus.driverName || 'N/A'}</p>
          <p style="font-size:0.75rem; color:#9ca3c4; margin-top:4px;">
            Last update: ${new Date(bus.timestamp || Date.now()).toLocaleTimeString()}
          </p>
        `);
      } else {
        // Create new marker
        const marker = L.marker([bus.lat, bus.lng], {
          icon: createBusIcon(bus.status === 'moving')
        }).addTo(map);

        marker.bindPopup(`
          <h4>${bus.busNumber || 'Bus'}</h4>
          <p><strong>Status:</strong> ${bus.status || 'Active'}</p>
          <p><strong>Driver:</strong> ${bus.driverName || 'N/A'}</p>
        `);

        busMarkersRef.current[id] = marker;
      }
    });

    // Remove markers for buses that are no longer in the list
    Object.keys(busMarkersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        busMarkersRef.current[id].remove();
        delete busMarkersRef.current[id];
      }
    });
  }, [busLocations]);

  // Update route stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old stop markers
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (routeStops.length === 0) return;

    // Add stop markers
    routeStops.forEach((stop) => {
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createStopIcon(stop.order)
      }).addTo(map);

      marker.bindPopup(`
        <h4>Stop #${stop.order}</h4>
        <p>${stop.name}</p>
      `);

      stopMarkersRef.current.push(marker);
    });

    // Draw route line
    const lineCoords = routeStops
      .sort((a, b) => a.order - b.order)
      .map(s => [s.lat, s.lng]);

    if (lineCoords.length >= 2) {
      routeLineRef.current = L.polyline(lineCoords, {
        color: '#7c3aed',
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 8'
      }).addTo(map);
    }
  }, [routeStops]);

  // Update student location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (studentMarkerRef.current) {
      studentMarkerRef.current.remove();
      studentMarkerRef.current = null;
    }

    if (studentLocation && studentLocation.lat && studentLocation.lng) {
      studentMarkerRef.current = L.marker(
        [studentLocation.lat, studentLocation.lng],
        { icon: studentIcon }
      ).addTo(map);

      studentMarkerRef.current.bindPopup('<h4>📍 Your Location</h4>');
    }
  }, [studentLocation]);

  return (
    <div
      ref={mapRef}
      className={`map-container ${className}`}
      id="live-map"
    ></div>
  );
}
