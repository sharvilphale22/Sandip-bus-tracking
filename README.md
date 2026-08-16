# 🚌 Sandip Bus Tracker

A modern, real-time college bus tracking web application with role-based dashboards for Students, Drivers, and Administrators.

## ✨ Features

- **Real-time GPS Tracking** — Live bus locations on OpenStreetMap via Socket.io
- **3 Role-based Dashboards** — Student, Driver, Admin
- **Live ETA Calculation** — Distance and estimated arrival time to each stop
- **Push Notifications** — Bus arriving, delays, trip start/stop
- **26 Pre-configured Buses** — With Pune-area routes and stops
- **Admin Panel** — CRUD for buses, driver/student assignment, live monitoring
- **Driver GPS Sharing** — Browser geolocation with simulation fallback
- **Dark Glassmorphism UI** — Premium, mobile-first responsive design
- **JWT Authentication** — Secure, role-based access control

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| Maps | Leaflet.js + OpenStreetMap |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Auth | JWT (jsonwebtoken) |
| Icons | Lucide React |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation & Run

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Start the backend server (port 5000)
node server.js

# 3. In a new terminal, install frontend dependencies
cd client
npm install

# 4. Start the frontend dev server (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🔑 Demo Login Credentials

| Role | Login ID | Password |
|------|----------|----------|
| Student | `STU001` | `password123` |
| Driver | `DRV001` | `password123` |
| Admin | `admin` | `admin123` |

> There are 104 student accounts (STU001–STU104), 26 driver accounts (DRV001–DRV026), all with password `password123`.

## 📁 Project Structure

```
sandip bus/
├── server/                    # Backend (Express + Socket.io)
│   ├── server.js              # Entry point
│   ├── config/keys.js         # JWT secret, API keys
│   ├── middleware/auth.js     # JWT auth middleware
│   ├── models/data.js         # In-memory data store
│   ├── routes/
│   │   ├── auth.js            # Login endpoints
│   │   ├── buses.js           # Bus CRUD
│   │   ├── users.js           # User profiles
│   │   └── notifications.js   # Notification endpoints
│   └── socket/tracking.js     # Real-time tracking handlers
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx            # Router & auth wrapper
│   │   ├── index.css          # Tailwind + glassmorphism styles
│   │   ├── context/           # Auth context
│   │   ├── components/        # Shared UI components
│   │   ├── pages/             # Role dashboards
│   │   └── utils/             # API & Socket helpers
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` — Login with ID + password
- `GET /api/auth/verify` — Verify JWT token

### Buses
- `GET /api/buses` — List all buses
- `POST /api/buses` — Add bus (admin)
- `PUT /api/buses/:id` — Update bus (admin)
- `DELETE /api/buses/:id` — Delete bus (admin)

### Users
- `GET /api/users/me` — Current user profile
- `GET /api/users/students` — List students (admin)
- `GET /api/users/drivers` — List drivers (admin)

### WebSocket Events
- `driver:start-trip` / `driver:stop-trip` — Trip lifecycle
- `driver:update-location` — GPS coordinates from driver
- `bus:location-update` — Broadcasted to students
- `notification` — Real-time push notifications

## 🔐 Security

- JWT-based authentication with 24h token expiry
- Role-based route protection (frontend + backend)
- CORS configured for local development

## 📝 Notes

- Data is stored **in-memory** — restarting the server resets all data
- If browser GPS is unavailable, the Driver dashboard uses **simulated movement** along the route for demo purposes
- All API keys are configured for local development; replace with production values as needed
