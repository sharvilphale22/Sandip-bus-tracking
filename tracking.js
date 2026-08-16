const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/keys');
const { buses, drivers, students, liveLocations, notifications, generateId } = require('../models/data');

function setupSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user.name} (${socket.user.role})`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    // ── Student events ──
    if (socket.user.role === 'student') {
      const student = students.find(s => s.id === socket.user.id);
      if (student && student.assignedBus) {
        socket.join(`bus:${student.assignedBus}`);
        console.log(`  📍 Student ${student.name} subscribed to bus ${student.assignedBus}`);

        // Send current location if available
        if (liveLocations[student.assignedBus]) {
          socket.emit('bus:location-update', {
            busId: student.assignedBus,
            ...liveLocations[student.assignedBus]
          });
        }
      }
    }

    // ── Driver events ──
    if (socket.user.role === 'driver') {
      const driver = drivers.find(d => d.id === socket.user.id);
      if (driver && driver.assignedBus) {
        socket.join(`bus:${driver.assignedBus}`);
      }

      // Start trip
      socket.on('driver:start-trip', () => {
        if (!driver) return;
        const bus = buses.find(b => b.id === driver.assignedBus);
        if (!bus) return;

        bus.tripActive = true;
        bus.status = 'on-route';
        driver.isActive = true;

        console.log(`  🚌 Driver ${driver.name} started trip on bus ${bus.number}`);

        // Notify students on this bus
        const notif = {
          id: generateId('NOTIF'),
          message: `Bus ${bus.number} has started its trip on route ${bus.route}!`,
          type: 'info',
          targetRole: 'student',
          targetIds: bus.assignedStudents,
          createdAt: new Date().toISOString(),
          read: false
        };
        notifications.push(notif);
        io.to(`bus:${bus.id}`).emit('notification', notif);
        io.to(`bus:${bus.id}`).emit('bus:trip-started', { busId: bus.id, busNumber: bus.number });

        // Notify admin
        io.to('role:admin').emit('bus:status-change', { busId: bus.id, status: 'on-route' });
      });

      // Update location
      socket.on('driver:update-location', (data) => {
        if (!driver) return;
        const bus = buses.find(b => b.id === driver.assignedBus);
        if (!bus || !bus.tripActive) return;

        const locationData = {
          lat: data.lat,
          lng: data.lng,
          heading: data.heading || 0,
          speed: data.speed || 0,
          timestamp: Date.now()
        };

        liveLocations[bus.id] = locationData;
        bus.currentLocation = { lat: data.lat, lng: data.lng };

        // Calculate ETA for each stop
        const etas = bus.stops.map(stop => {
          const dist = haversineDistance(data.lat, data.lng, stop.lat, stop.lng);
          const speed = Math.max(data.speed || 20, 5); // km/h, min 5
          const etaMinutes = Math.round((dist / speed) * 60);
          return { stopName: stop.name, eta: etaMinutes, distance: dist.toFixed(2) };
        });

        // Broadcast to all clients watching this bus
        io.to(`bus:${bus.id}`).emit('bus:location-update', {
          busId: bus.id,
          busNumber: bus.number,
          ...locationData,
          etas
        });

        // Send to admin
        io.to('role:admin').emit('bus:location-update', {
          busId: bus.id,
          busNumber: bus.number,
          ...locationData,
          etas
        });

        // Check if bus is near any stop (within 500m) — send arrival notification
        etas.forEach(eta => {
          if (eta.eta <= 5 && eta.eta > 0) {
            io.to(`bus:${bus.id}`).emit('notification', {
              id: generateId('NOTIF'),
              message: `Bus ${bus.number} arriving at ${eta.stopName} in ~${eta.eta} minutes!`,
              type: 'arrival',
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        });
      });

      // Stop trip
      socket.on('driver:stop-trip', () => {
        if (!driver) return;
        const bus = buses.find(b => b.id === driver.assignedBus);
        if (!bus) return;

        bus.tripActive = false;
        bus.status = 'idle';
        bus.currentLocation = null;
        driver.isActive = false;
        delete liveLocations[bus.id];

        console.log(`  🛑 Driver ${driver.name} stopped trip on bus ${bus.number}`);

        const notif = {
          id: generateId('NOTIF'),
          message: `Bus ${bus.number} has completed its trip.`,
          type: 'info',
          targetRole: 'student',
          targetIds: bus.assignedStudents,
          createdAt: new Date().toISOString(),
          read: false
        };
        notifications.push(notif);
        io.to(`bus:${bus.id}`).emit('notification', notif);
        io.to(`bus:${bus.id}`).emit('bus:trip-ended', { busId: bus.id });

        io.to('role:admin').emit('bus:status-change', { busId: bus.id, status: 'idle' });
      });
    }

    // ── Admin events ──
    if (socket.user.role === 'admin') {
      // Admin subscribes to all bus updates automatically via 'role:admin' room

      socket.on('admin:subscribe-all', () => {
        buses.forEach(bus => {
          socket.join(`bus:${bus.id}`);
        });
        // Send all current live locations
        socket.emit('admin:all-locations', liveLocations);
      });
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.user.name}`);
    });
  });
}

// ── Haversine distance (km) ──
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

module.exports = { setupSocketHandlers };
