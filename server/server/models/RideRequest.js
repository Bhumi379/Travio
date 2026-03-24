const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema(
  {
    // The ride being requested
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },

    // User requesting to join
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    // Status of the request
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },

    // Message from requester (optional)
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Virtual id
rideRequestSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

rideRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// Index to ensure one request per user per ride
rideRequestSchema.index({ rideId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
