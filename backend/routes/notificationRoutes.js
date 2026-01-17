const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

const auth = require('../middleware/auth');

// Get user notifications
router.get('/', auth, getNotifications);

// Mark single notification as read
router.put('/:notificationId/read', auth, markAsRead);

// Mark all notifications as read
router.put('/read-all', auth, markAllAsRead);

// Delete single notification
router.delete('/:notificationId', auth, deleteNotification);

// Delete all notifications
router.delete('/', auth, deleteAllNotifications);

module.exports = router;
