const express = require('express');
const router = express.Router();

const protect = require('../middleware/authmiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

// Get all notifications for logged-in user (MUST BE FIRST before /:notificationId routes)
router.get('/', protect, getNotifications);

// Mark all notifications as read (MUST BE BEFORE /:notificationId)
router.put('/read-all', protect, markAllAsRead);

// Mark specific notification as read
router.put('/:notificationId/read', protect, markAsRead);

// Delete a notification
router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;
