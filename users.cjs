const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { students, drivers, buses, allStopNames, generateDriverId, generateStudentId, hashPassword } = require('../models/data');

const router = express.Router();

// GET /api/users/me — get current user profile + assigned bus info
router.get('/me', verifyToken, (req, res) => {
  const { id, role } = req.user;

  if (role === 'student') {
    const student = students.find(s => s.id === id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const bus = buses.find(b => b.id === student.assignedBus);
    return res.json({
      id: student.id,
      name: student.name,
      role: 'student',
      erpId: student.erpId,
      assignedBus: bus ? {
        id: bus.id,
        number: bus.number,
        route: bus.route,
        status: bus.status,
        tripActive: bus.tripActive,
        stops: bus.stops
      } : null,
      pickupStop: student.pickupStop,
      dropStop: student.dropStop || 'College Campus (Main)',
      pickupLocation: student.pickupLocation || student.pickupStop,
      dropLocation: student.dropLocation || 'College Campus (Main)',
    });
  }

  if (role === 'driver') {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });

    const bus = buses.find(b => b.id === driver.assignedBus);
    return res.json({
      id: driver.id,
      name: driver.name,
      role: 'driver',
      driverId: driver.driverId,
      phone: driver.phone,
      assignedBus: bus ? {
        id: bus.id,
        number: bus.number,
        route: bus.route,
        status: bus.status,
        tripActive: bus.tripActive,
        stops: bus.stops
      } : null,
      isActive: driver.isActive
    });
  }

  if (role === 'admin') {
    return res.json({
      id: req.user.id,
      name: req.user.name,
      role: 'admin'
    });
  }

  res.status(400).json({ message: 'Unknown role.' });
});

// GET /api/users/students — list all students (admin only)
router.get('/students', verifyToken, requireRole('admin'), (req, res) => {
  const list = students.map(s => ({
    id: s.id,
    name: s.name,
    erpId: s.erpId,
    assignedBus: s.assignedBus,
    pickupStop: s.pickupStop,
    dropStop: s.dropStop || 'College Campus (Main)',
    pickupLocation: s.pickupLocation || s.pickupStop,
    dropLocation: s.dropLocation || 'College Campus (Main)',
  }));
  res.json(list);
});

// POST /api/users/students — add student (admin only)
router.post('/students', verifyToken, requireRole('admin'), (req, res) => {
  const { name, erpId, password, pickupLocation, dropLocation, assignedBus } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Name and password are required.' });
  }

  const finalErpId = erpId || generateStudentId();

  // Check duplicate ERP ID
  if (students.find(s => s.erpId === finalErpId)) {
    return res.status(400).json({ message: 'ERP ID already exists.' });
  }

  const newStudent = {
    id: finalErpId,
    name,
    erpId: finalErpId,
    password: hashPassword(password),
    role: 'student',
    assignedBus: assignedBus || null,
    pickupStop: pickupLocation || '',
    dropStop: dropLocation || 'College Campus (Main)',
    pickupLocation: pickupLocation || '',
    dropLocation: dropLocation || 'College Campus (Main)',
    notifications: [],
  };

  students.push(newStudent);

  // Add to bus if assigned
  if (assignedBus) {
    const bus = buses.find(b => b.id === assignedBus);
    if (bus && !bus.assignedStudents.includes(finalErpId)) {
      bus.assignedStudents.push(finalErpId);
    }
  }

  res.status(201).json({
    message: 'Student added successfully.',
    student: { id: newStudent.id, name: newStudent.name, erpId: newStudent.erpId, assignedBus: newStudent.assignedBus, pickupStop: newStudent.pickupStop, dropStop: newStudent.dropStop, pickupLocation: newStudent.pickupLocation, dropLocation: newStudent.dropLocation }
  });
});

// PUT /api/users/students/:id — update student (admin only)
router.put('/students/:id', verifyToken, requireRole('admin'), (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const { name, pickupLocation, dropLocation, assignedBus, password } = req.body;

  if (name) student.name = name;
  if (pickupLocation !== undefined) { student.pickupLocation = pickupLocation; student.pickupStop = pickupLocation; }
  if (dropLocation !== undefined) { student.dropLocation = dropLocation; student.dropStop = dropLocation; }
  if (password) student.password = hashPassword(password);

  // Handle bus reassignment
  if (assignedBus !== undefined && assignedBus !== student.assignedBus) {
    // Remove from old bus
    buses.forEach(b => {
      b.assignedStudents = b.assignedStudents.filter(sid => sid !== student.id);
    });
    student.assignedBus = assignedBus;
    if (assignedBus) {
      const bus = buses.find(b => b.id === assignedBus);
      if (bus && !bus.assignedStudents.includes(student.id)) {
        bus.assignedStudents.push(student.id);
      }
    }
  }

  res.json({
    message: 'Student updated.',
    student: { id: student.id, name: student.name, erpId: student.erpId, assignedBus: student.assignedBus, pickupStop: student.pickupStop, dropStop: student.dropStop, pickupLocation: student.pickupLocation, dropLocation: student.dropLocation }
  });
});

// DELETE /api/users/students/:id — delete student (admin only)
router.delete('/students/:id', verifyToken, requireRole('admin'), (req, res) => {
  const idx = students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Student not found.' });

  const student = students[idx];
  // Remove from bus
  buses.forEach(b => {
    b.assignedStudents = b.assignedStudents.filter(sid => sid !== student.id);
  });

  students.splice(idx, 1);
  res.json({ message: 'Student deleted.' });
});

// GET /api/users/drivers — list all drivers (admin only)
router.get('/drivers', verifyToken, requireRole('admin'), (req, res) => {
  const list = drivers.map(d => ({
    id: d.id,
    name: d.name,
    driverId: d.driverId,
    phone: d.phone,
    assignedBus: d.assignedBus,
    isActive: d.isActive,
  }));
  res.json(list);
});

// POST /api/users/drivers — add driver (admin only)
router.post('/drivers', verifyToken, requireRole('admin'), (req, res) => {
  const { name, phone, assignedBus, password } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Driver name is required.' });
  }

  const driverId = generateDriverId();

  const newDriver = {
    id: driverId,
    name,
    driverId,
    password: hashPassword(password || 'password123'),
    role: 'driver',
    assignedBus: assignedBus || null,
    phone: phone || '',
    isActive: false,
  };

  drivers.push(newDriver);

  // Assign to bus if specified
  if (assignedBus) {
    const bus = buses.find(b => b.id === assignedBus);
    if (bus) {
      // Unassign previous driver from this bus
      const prevDriver = drivers.find(d => d.id === bus.assignedDriver && d.id !== driverId);
      if (prevDriver) prevDriver.assignedBus = null;
      bus.assignedDriver = driverId;
    }
  }

  res.status(201).json({
    message: 'Driver added successfully.',
    driver: { id: newDriver.id, name: newDriver.name, driverId: newDriver.driverId, phone: newDriver.phone, assignedBus: newDriver.assignedBus, isActive: false }
  });
});

// PUT /api/users/drivers/:id — update driver (admin only)
router.put('/drivers/:id', verifyToken, requireRole('admin'), (req, res) => {
  const driver = drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });

  const { name, phone, assignedBus, password } = req.body;

  if (name) driver.name = name;
  if (phone !== undefined) driver.phone = phone;
  if (password) driver.password = hashPassword(password);

  // Handle bus reassignment
  if (assignedBus !== undefined && assignedBus !== driver.assignedBus) {
    // Unassign from old bus
    if (driver.assignedBus) {
      const oldBus = buses.find(b => b.id === driver.assignedBus);
      if (oldBus && oldBus.assignedDriver === driver.id) oldBus.assignedDriver = null;
    }
    driver.assignedBus = assignedBus;
    if (assignedBus) {
      const newBus = buses.find(b => b.id === assignedBus);
      if (newBus) {
        // Unassign previous driver
        const prevDriver = drivers.find(d => d.id === newBus.assignedDriver && d.id !== driver.id);
        if (prevDriver) prevDriver.assignedBus = null;
        newBus.assignedDriver = driver.id;
      }
    }
  }

  res.json({
    message: 'Driver updated.',
    driver: { id: driver.id, name: driver.name, driverId: driver.driverId, phone: driver.phone, assignedBus: driver.assignedBus, isActive: driver.isActive }
  });
});

// DELETE /api/users/drivers/:id — delete driver (admin only)
router.delete('/drivers/:id', verifyToken, requireRole('admin'), (req, res) => {
  const idx = drivers.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Driver not found.' });

  const driver = drivers[idx];
  // Unassign from bus
  if (driver.assignedBus) {
    const bus = buses.find(b => b.id === driver.assignedBus);
    if (bus && bus.assignedDriver === driver.id) bus.assignedDriver = null;
  }

  drivers.splice(idx, 1);
  res.json({ message: 'Driver deleted.' });
});

// GET /api/users/stops — get all unique stop names
router.get('/stops', verifyToken, (req, res) => {
  res.json(allStopNames);
});

// PUT /api/users/allot-bus — bus allotment: assign driver to bus (admin only)
router.put('/allot-bus', verifyToken, requireRole('admin'), (req, res) => {
  const { busId, driverId } = req.body;

  const bus = buses.find(b => b.id === busId);
  if (!bus) return res.status(404).json({ message: 'Bus not found.' });

  const driver = drivers.find(d => d.id === driverId);
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });

  // Unassign driver from previous bus
  if (driver.assignedBus && driver.assignedBus !== busId) {
    const prevBus = buses.find(b => b.id === driver.assignedBus);
    if (prevBus && prevBus.assignedDriver === driver.id) prevBus.assignedDriver = null;
  }

  // Unassign previous driver from this bus
  if (bus.assignedDriver && bus.assignedDriver !== driverId) {
    const prevDriver = drivers.find(d => d.id === bus.assignedDriver);
    if (prevDriver) prevDriver.assignedBus = null;
  }

  bus.assignedDriver = driverId;
  driver.assignedBus = busId;

  res.json({
    message: `Driver ${driver.name} assigned to bus ${bus.number}.`,
    bus: { id: bus.id, number: bus.number, assignedDriver: bus.assignedDriver },
    driver: { id: driver.id, name: driver.name, assignedBus: driver.assignedBus },
  });
});

module.exports = router;
