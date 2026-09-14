const bcrypt = require('bcryptjs');

// ============================================================================
// IN-MEMORY DATA STORE — Sandip Bus Tracker (Nashik, Maharashtra)
// ============================================================================

const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

let driverIdCounter = 27;
let studentIdCounter = 105;

// ── Route definitions (Nashik-area college bus routes) ───────────────────────
const routes = [
  {
    name: 'Panchavati - College',
    stops: [
      { name: 'Panchavati', lat: 20.0063, lng: 73.7910 },
      { name: 'Shalimar', lat: 20.0030, lng: 73.7850 },
      { name: 'Raviwar Karanja', lat: 19.9990, lng: 73.7890 },
      { name: 'CBS', lat: 19.9975, lng: 73.7920 },
      { name: 'College Road', lat: 19.9890, lng: 73.7960 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Nashik Road - College',
    stops: [
      { name: 'Nashik Road Station', lat: 19.9630, lng: 73.8130 },
      { name: 'Dwarka', lat: 19.9670, lng: 73.8070 },
      { name: 'Bytco Point', lat: 19.9740, lng: 73.8000 },
      { name: 'Ashok Stambh', lat: 19.9830, lng: 73.7930 },
      { name: 'Tilak Wadi', lat: 19.9860, lng: 73.7960 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Gangapur Road - College',
    stops: [
      { name: 'Gangapur Road', lat: 20.0190, lng: 73.7650 },
      { name: 'Rane Nagar', lat: 20.0140, lng: 73.7700 },
      { name: 'Tidke Colony', lat: 20.0080, lng: 73.7760 },
      { name: 'Ashok Stambh', lat: 19.9830, lng: 73.7930 },
      { name: 'Rajiv Nagar', lat: 19.9850, lng: 73.7960 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Satpur - College',
    stops: [
      { name: 'Satpur MIDC', lat: 20.0250, lng: 73.7550 },
      { name: 'Satpur Colony', lat: 20.0210, lng: 73.7590 },
      { name: 'Ambad Link Road', lat: 20.0150, lng: 73.7640 },
      { name: 'Mumbai Naka', lat: 20.0050, lng: 73.7730 },
      { name: 'Indira Nagar', lat: 19.9970, lng: 73.7830 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Indira Nagar - College',
    stops: [
      { name: 'Indira Nagar', lat: 19.9970, lng: 73.7830 },
      { name: 'Patel Chowk', lat: 19.9940, lng: 73.7860 },
      { name: 'Sharanpur Road', lat: 19.9910, lng: 73.7890 },
      { name: 'Mahatma Nagar', lat: 19.9870, lng: 73.7920 },
      { name: 'Canada Corner', lat: 19.9845, lng: 73.7950 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'CIDCO - College',
    stops: [
      { name: 'CIDCO', lat: 20.0320, lng: 73.7480 },
      { name: 'Pathardi Phata', lat: 20.0260, lng: 73.7530 },
      { name: 'Nashik Phata', lat: 20.0180, lng: 73.7610 },
      { name: 'Mumbai Naka', lat: 20.0050, lng: 73.7730 },
      { name: 'CBS', lat: 19.9975, lng: 73.7920 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Deolali - College',
    stops: [
      { name: 'Deolali Camp', lat: 19.9460, lng: 73.8350 },
      { name: 'Deolali Gaon', lat: 19.9520, lng: 73.8280 },
      { name: 'Vihas Nagar', lat: 19.9580, lng: 73.8210 },
      { name: 'Nashik Road Station', lat: 19.9630, lng: 73.8130 },
      { name: 'Bytco Point', lat: 19.9740, lng: 73.8000 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Makhmalabad - College',
    stops: [
      { name: 'Makhmalabad', lat: 20.0400, lng: 73.7700 },
      { name: 'Gadge Nagar', lat: 20.0340, lng: 73.7720 },
      { name: 'Satpur Colony', lat: 20.0210, lng: 73.7590 },
      { name: 'Rane Nagar', lat: 20.0140, lng: 73.7700 },
      { name: 'Panchavati', lat: 20.0063, lng: 73.7910 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Adgaon - College',
    stops: [
      { name: 'Adgaon Naka', lat: 20.0450, lng: 73.7400 },
      { name: 'Pipeline Road', lat: 20.0370, lng: 73.7480 },
      { name: 'Pathardi Phata', lat: 20.0260, lng: 73.7530 },
      { name: 'CIDCO', lat: 20.0320, lng: 73.7480 },
      { name: 'Mumbai Naka', lat: 20.0050, lng: 73.7730 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Trimbak Road - College',
    stops: [
      { name: 'Trimbak Naka', lat: 20.0260, lng: 73.7830 },
      { name: 'Dasak Phata', lat: 20.0200, lng: 73.7850 },
      { name: 'Panchavati', lat: 20.0063, lng: 73.7910 },
      { name: 'Shalimar', lat: 20.0030, lng: 73.7850 },
      { name: 'CBS', lat: 19.9975, lng: 73.7920 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Sinnar - College',
    stops: [
      { name: 'Sinnar Phata', lat: 19.9300, lng: 73.8400 },
      { name: 'Ozar Phata', lat: 19.9400, lng: 73.8370 },
      { name: 'Deolali Camp', lat: 19.9460, lng: 73.8350 },
      { name: 'Nashik Road Station', lat: 19.9630, lng: 73.8130 },
      { name: 'Dwarka', lat: 19.9670, lng: 73.8070 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Peth Road - College',
    stops: [
      { name: 'Peth Naka', lat: 20.0100, lng: 73.8050 },
      { name: 'Hirawadi', lat: 20.0060, lng: 73.8010 },
      { name: 'Govind Nagar', lat: 20.0010, lng: 73.7970 },
      { name: 'Raviwar Karanja', lat: 19.9990, lng: 73.7890 },
      { name: 'Ashok Stambh', lat: 19.9830, lng: 73.7930 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
  {
    name: 'Upnagar - College',
    stops: [
      { name: 'Upnagar Naka', lat: 19.9900, lng: 73.8100 },
      { name: 'Jail Road', lat: 19.9870, lng: 73.8060 },
      { name: 'Ashok Stambh', lat: 19.9830, lng: 73.7930 },
      { name: 'Tilak Wadi', lat: 19.9860, lng: 73.7960 },
      { name: 'College Road', lat: 19.9890, lng: 73.7960 },
      { name: 'College Campus (Main)', lat: 19.9810, lng: 73.8000 },
    ]
  },
];

// Collect all unique stop names (excluding College Campus) for pickup assignment
const allStopNames = [...new Set(routes.flatMap(r => r.stops.map(s => s.name)).filter(n => n !== 'College Campus (Main)'))];

// ── Generate 26 buses ────────────────────────────────────────────────────────
const buses = [];
for (let i = 1; i <= 26; i++) {
  const route = routes[(i - 1) % routes.length];
  buses.push({
    id: `BUS${String(i).padStart(3, '0')}`,
    number: `SB-${String(i).padStart(2, '0')}`,
    route: route.name,
    stops: route.stops.map((stop, idx) => ({
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      order: idx + 1
    })),
    assignedDriver: `DRV${String(i).padStart(3, '0')}`,
    assignedStudents: [],
    status: 'idle',
    currentLocation: null,
    tripActive: false,
    capacity: 50,
    createdAt: new Date().toISOString()
  });
}

// Assign students to buses (4 students per bus)
for (let i = 1; i <= 104; i++) {
  const busIndex = (i - 1) % 26;
  buses[busIndex].assignedStudents.push(`STU${String(i).padStart(3, '0')}`);
}

// ── Students (104) ───────────────────────────────────────────────────────────
const students = [];
const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Sai', 'Arjun', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aadhya', 'Isha', 'Kiara', 'Riya', 'Priya', 'Kavya',
  'Rohan', 'Harsh', 'Dev', 'Yash', 'Ritik', 'Sneha'];
const lastNames = ['Sharma', 'Patel', 'Kulkarni', 'Deshmukh', 'Joshi', 'Patil', 'Shah', 'Mehta', 'Gupta', 'Singh',
  'Reddy', 'Iyer', 'Nair', 'Kumar', 'Verma', 'Chauhan', 'Yadav', 'Tiwari', 'Pandey', 'Mishra'];

for (let i = 1; i <= 104; i++) {
  const busIndex = (i - 1) % 26;
  const fn = firstNames[(i - 1) % firstNames.length];
  const ln = lastNames[(i - 1) % lastNames.length];
  const busStops = buses[busIndex].stops.filter(s => s.name !== 'College Campus (Main)');
  const pickupStop = busStops[Math.floor(Math.random() * busStops.length)]?.name || busStops[0]?.name;
  students.push({
    id: `STU${String(i).padStart(3, '0')}`,
    name: `${fn} ${ln}`,
    erpId: `STU${String(i).padStart(3, '0')}`,
    password: hashPassword('password123'),
    role: 'student',
    assignedBus: buses[busIndex].id,
    pickupStop: pickupStop,
    dropStop: 'College Campus (Main)',
    pickupLocation: pickupStop,        // Home location (morning start)
    dropLocation: 'College Campus (Main)', // Morning destination
    notifications: []
  });
}

// ── Drivers (26) ─────────────────────────────────────────────────────────────
const drivers = [];
const driverNames = ['Rajesh', 'Suresh', 'Manoj', 'Ramesh', 'Vijay', 'Prakash', 'Ganesh', 'Sunil', 'Anil', 'Sanjay',
  'Deepak', 'Amit', 'Ravi', 'Ashok', 'Mohan', 'Vinod', 'Kiran', 'Nitin', 'Sachin', 'Ajay',
  'Rahul', 'Pradeep', 'Santosh', 'Dinesh', 'Mahesh', 'Yogesh'];

for (let i = 1; i <= 26; i++) {
  drivers.push({
    id: `DRV${String(i).padStart(3, '0')}`,
    name: `${driverNames[i - 1]} Patil`,
    driverId: `DRV${String(i).padStart(3, '0')}`,
    password: hashPassword('password123'),
    role: 'driver',
    assignedBus: buses[i - 1].id,
    phone: `98${String(70000000 + i).padStart(8, '0')}`,
    isActive: false
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────
const admins = [
  {
    id: 'ADMIN001',
    name: 'Admin User',
    username: 'admin',
    password: hashPassword('admin123'),
    role: 'admin'
  }
];

// ── Notifications ────────────────────────────────────────────────────────────
const notifications = [
  { id: 'NOTIF001', message: 'Welcome to Sandip Bus Tracker! Track your bus in real-time.', type: 'info', targetRole: 'student', targetIds: [], createdAt: new Date().toISOString(), read: false },
  { id: 'NOTIF002', message: 'Please ensure GPS is enabled before starting your trip.', type: 'info', targetRole: 'driver', targetIds: [], createdAt: new Date().toISOString(), read: false },
];

// ── Live locations (updated by Socket.io) ────────────────────────────────────
const liveLocations = {};

// ── Helper functions ─────────────────────────────────────────────────────────
function findUserByCredentials(loginId, password) {
  const student = students.find(s => s.erpId === loginId);
  if (student && bcrypt.compareSync(password, student.password)) {
    return { id: student.id, name: student.name, role: 'student' };
  }
  const driver = drivers.find(d => d.driverId === loginId);
  if (driver && bcrypt.compareSync(password, driver.password)) {
    return { id: driver.id, name: driver.name, role: 'driver' };
  }
  const admin = admins.find(a => a.username === loginId);
  if (admin && bcrypt.compareSync(password, admin.password)) {
    return { id: admin.id, name: admin.name, role: 'admin' };
  }
  return null;
}

function generateId(prefix) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

function generateDriverId() {
  const id = `DRV${String(driverIdCounter).padStart(3, '0')}`;
  driverIdCounter++;
  return id;
}

function generateStudentId() {
  const id = `STU${String(studentIdCounter).padStart(3, '0')}`;
  studentIdCounter++;
  return id;
}

module.exports = {
  buses,
  students,
  drivers,
  admins,
  notifications,
  liveLocations,
  allStopNames,
  findUserByCredentials,
  generateId,
  generateDriverId,
  generateStudentId,
  hashPassword,
};
