const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { buses, drivers, students, generateId } = require('../models/data');

const router = express.Router();

// GET /api/buses — list all buses
router.get('/', verifyToken, (req, res) => {
  const busList = buses.map(b => ({
    id: b.id,
    number: b.number,
    route: b.route,
    status: b.status,
    assignedDriver: b.assignedDriver,
    studentCount: b.assignedStudents.length,
    capacity: b.capacity,
    tripActive: b.tripActive,
    stops: b.stops
  }));
  res.json(busList);
});

// GET /api/buses/:id — single bus details
router.get('/:id', verifyToken, (req, res) => {
  const bus = buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: 'Bus not found.' });

  const driver = drivers.find(d => d.id === bus.assignedDriver);
  const assignedStudentList = students
    .filter(s => bus.assignedStudents.includes(s.id))
    .map(s => ({ id: s.id, name: s.name, pickupStop: s.pickupStop }));

  res.json({
    ...bus,
    driverName: driver ? driver.name : 'Unassigned',
    driverPhone: driver ? driver.phone : null,
    studentList: assignedStudentList
  });
});

// POST /api/buses — add a new bus (admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
  const { number, route, stops, capacity } = req.body;

  if (!number || !route) {
    return res.status(400).json({ message: 'Bus number and route are required.' });
  }

  const newBus = {
    id: generateId('BUS'),
    number,
    route,
    stops: stops || [],
    assignedDriver: null,
    assignedStudents: [],
    status: 'idle',
    currentLocation: null,
    tripActive: false,
    capacity: capacity || 50,
    createdAt: new Date().toISOString()
  };

  buses.push(newBus);
  res.status(201).json({ message: 'Bus added successfully.', bus: newBus });
});

// PUT /api/buses/:id — update bus (admin only)
router.put('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const bus = buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: 'Bus not found.' });

  const { number, route, stops, capacity, status } = req.body;
  if (number) bus.number = number;
  if (route) bus.route = route;
  if (stops) bus.stops = stops;
  if (capacity) bus.capacity = capacity;
  if (status) bus.status = status;

  res.json({ message: 'Bus updated successfully.', bus });
});

// DELETE /api/buses/:id — delete bus (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const index = buses.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Bus not found.' });

  buses.splice(index, 1);
  res.json({ message: 'Bus deleted successfully.' });
});

// PUT /api/buses/:id/assign-driver — assign driver to bus (admin)
router.put('/:id/assign-driver', verifyToken, requireRole('admin'), (req, res) => {
  const bus = buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: 'Bus not found.' });

  const { driverId } = req.body;
  const driver = drivers.find(d => d.id === driverId);
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });

  // Remove driver from previous bus
  buses.forEach(b => {
    if (b.assignedDriver === driverId) b.assignedDriver = null;
  });

  bus.assignedDriver = driverId;
  driver.assignedBus = bus.id;

  res.json({ message: `Driver ${driver.name} assigned to bus ${bus.number}.`, bus });
});

// PUT /api/buses/:id/assign-students — assign students to bus (admin)
router.put('/:id/assign-students', verifyToken, requireRole('admin'), (req, res) => {
  const bus = buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: 'Bus not found.' });

  const { studentIds } = req.body;
  if (!Array.isArray(studentIds)) {
    return res.status(400).json({ message: 'studentIds must be an array.' });
  }

  // Update student assignments
  studentIds.forEach(sid => {
    const student = students.find(s => s.id === sid);
    if (student) {
      // Remove from previous bus
      buses.forEach(b => {
        b.assignedStudents = b.assignedStudents.filter(id => id !== sid);
      });
      student.assignedBus = bus.id;
      if (!bus.assignedStudents.includes(sid)) {
        bus.assignedStudents.push(sid);
      }
    }
  });

  res.json({ message: `${studentIds.length} students assigned to bus ${bus.number}.`, bus });
});

module.exports = router;
