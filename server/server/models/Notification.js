const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // User who receives the notification (ride creator)
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },

    // User who sends the notification (person requesting to join)
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },

    // The ride related to this notification
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },

    // Type of notification (for future extensibility)
    type: {
      type: String,
      enum: ['join_request', 'request_accepted', 'request_rejected'],
      default: 'join_request',
    },

    // Status of the notification
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
    },

    // Message content
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Virtual id
notificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
