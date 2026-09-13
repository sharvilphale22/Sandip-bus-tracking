const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { jwtSecret, jwtExpiry } = require('../config/keys.cjs');
const { students, drivers, admins } = require('../models/data.js');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        message: 'Login ID and password are required.'
      });
    }

    const cleanLoginId = String(loginId).trim();

    let user = null;
    let role = null;

    // -------------------------
    // Student login
    // -------------------------
    const student = students.find(
      s => s.id === cleanLoginId || s.erpId === cleanLoginId
    );

    if (student) {
      user = student;
      role = 'student';
    }

    // -------------------------
    // Driver login
    // -------------------------
    if (!user) {
      const driver = drivers.find(
        d => d.id === cleanLoginId || d.driverId === cleanLoginId
      );

      if (driver) {
        user = driver;
        role = 'driver';
      }
    }

    // -------------------------
    // Admin login
    // -------------------------
    if (!user) {
      const admin = admins.find(
        a => a.username === cleanLoginId
      );

      if (admin) {
        user = admin;
        role = 'admin';
      }
    }

    // User not found
    if (!user) {
      return res.status(401).json({
        message: 'Invalid login ID or password.'
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid login ID or password.'
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: role,
        name: user.name
      },
      jwtSecret,
      {
        expiresIn: jwtExpiry
      }
    );

    // Never send password to frontend
    const safeUser = { ...user };
    delete safeUser.password;

    // Send response
    return res.json({
      message: 'Login successful.',
      token,
      user: {
        ...safeUser,
        role
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Internal server error.'
    });
  }
});

module.exports = router;
