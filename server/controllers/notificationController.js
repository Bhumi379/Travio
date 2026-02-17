const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

/* =====================================================
   GET NOTIFICATIONS FOR LOGGED-IN USER
===================================================== */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log("📬 Fetching notifications for user:", userId);

    const notifications = await Notification.find({ recipientUserId: userId })
      .populate('senderUserId', 'name email profilePicture')
      .populate('rideId', 'pickup destination departureTime')
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientUserId: userId,
      status: 'unread',
    });

    console.log("✅ Found", notifications.length, "notifications, unread:", unreadCount);

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: err.message,
    });
  }
};

/* =====================================================
   MARK NOTIFICATION AS READ
===================================================== */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientUserId: userId },
      { status: 'read' },
      { new: true }
    )
      .populate('senderUserId', 'name email profilePicture')
      .populate('rideId', 'pickup destination departureTime');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: err.message,
    });
  }
};

/* =====================================================
   MARK ALL NOTIFICATIONS AS READ
===================================================== */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipientUserId: userId, status: 'unread' },
      { status: 'read' }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: err.message,
    });
  }
};

/* =====================================================
   DELETE NOTIFICATION
===================================================== */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientUserId: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: err.message,
    });
  }
};

/* =====================================================
   CREATE NOTIFICATION (Internal function - not exposed as route)
===================================================== */
const createNotification = async (recipientUserId, senderUserId, rideId, type, message) => {
  try {
    const normalizeId = (val) => {
      if (!val) return null;
      if (typeof val === 'object') {
        if (val._id) return val._id;
        if (val.id) return val.id;
      }
      return val;
    };

    const recipient = normalizeId(recipientUserId);
    const sender = normalizeId(senderUserId);

    // Ensure values are castable to ObjectId when appropriate
    const doc = new Notification({
      recipientUserId: new mongoose.Types.ObjectId(recipient),
      senderUserId: new mongoose.Types.ObjectId(sender),
      rideId: new mongoose.Types.ObjectId(rideId),
      type,
      message,
    });

    await doc.save();
    console.log('Notification created for recipient:', recipient, 'type:', type);
    return doc;
  } catch (err) {
    console.error('Error creating notification:', err);
    // return nothing so callers continue without crashing; caller logs/handles errors
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
