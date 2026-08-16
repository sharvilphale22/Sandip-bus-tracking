const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { notifications, students, generateId } = require('../models/data');

const router = express.Router();

// GET /api/notifications — get notifications for current user
router.get('/', verifyToken, (req, res) => {
  const { id, role } = req.user;
  
  const userNotifs = notifications.filter(n => {
    // Notifications targeted to specific users
    if (n.targetIds && n.targetIds.length > 0) {
      return n.targetIds.includes(id);
    }
    // Notifications targeted to a role
    if (n.targetRole === role || n.targetRole === 'all') {
      return true;
    }
    return false;
  });

  res.json(userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/notifications — send notification (admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
  const { message, targetRole, targetIds, type } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Notification message is required.' });
  }

  const notif = {
    id: generateId('NOTIF'),
    message,
    type: type || 'info', // info, warning, delay, arrival
    targetRole: targetRole || 'all',
    targetIds: targetIds || [],
    createdAt: new Date().toISOString(),
    read: false
  };

  notifications.push(notif);

  // Emit via socket if io is available
  if (req.app.get('io')) {
    const io = req.app.get('io');
    if (targetIds && targetIds.length > 0) {
      targetIds.forEach(uid => {
        io.to(`user:${uid}`).emit('notification', notif);
      });
    } else {
      io.emit('notification', notif);
    }
  }

  res.status(201).json({ message: 'Notification sent.', notification: notif });
});

// GET /api/notifications/all — get all notifications (admin only)
router.get('/all', verifyToken, requireRole('admin'), (req, res) => {
  res.json(notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

module.exports = router;
