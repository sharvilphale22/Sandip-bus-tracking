require('dotenv').config();

const jwtSecret =
  process.env.JWT_SECRET || 'dev-only-sandip-bus-jwt-secret';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

// Allowed frontend origins
const allowedOrigins = [
  // Production Vercel
  'https://sandip-bus-tracking.vercel.app',

  // Current Vercel preview
  'https://sandip-bus-tracking-5b1oj6jw-sharvil1.vercel.app',

  // Local development
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',

  // Environment variables
  process.env.CLIENT_URL,
  ...(process.env.CORS_ORIGINS || '').split(',')
]
  .map(origin => origin && origin.trim())
  .filter(Boolean);

const uniqueOrigins = [...new Set(allowedOrigins)];

module.exports = {
  jwtSecret,

  jwtExpiry: '24h',

  port: process.env.PORT || 5001,

  allowedOrigins: uniqueOrigins,

  apiKeys: {
    websocketEndpoint: process.env.WS_ENDPOINT,

    openStreetMap:
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

    openStreetMapAttribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};
