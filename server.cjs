const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { port, allowedOrigins } = require('./config/keys');

// Routes
const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/buses');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const { setupSocketHandlers } = require('./socket/tracking');

const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
};

// Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} │ ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
server.listen(port, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║      🚌  Sandip Bus Tracker — Server        ║');
  console.log(`  ║      Running on port ${port}                   ║`);
  console.log('  ║      WebSocket: Ready                       ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Demo Logins:');
  console.log('  ─────────────────────────────────────────────');
  console.log('  Student:  STU001 / password123');
  console.log('  Driver:   DRV001 / password123');
  console.log('  Admin:    admin  / admin123');
  console.log('');
});

module.exports = { app, server, io };
