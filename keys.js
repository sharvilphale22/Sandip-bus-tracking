require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET || 'dev-only-sandip-bus-jwt-secret';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const localOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ...(process.env.CORS_ORIGINS || '').split(','),
]
  .map(origin => origin && origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...localOrigins, ...envOrigins])];

module.exports = {
  jwtSecret,
  jwtExpiry: '24h',
  port: process.env.PORT || 5001,
  allowedOrigins,
  
  // Dummy API keys — replace with real values in production
  apiKeys: {
    websocketEndpoint: process.env.WS_ENDPOINT,
    openStreetMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    openStreetMapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};
