const mongoose = require('mongoose');

/* ========================= REGEX ========================= */
const phoneRegex = /^[0-9]{10}$/;
const aadharRegex = /^[0-9]{12}$/;
const plateRegex = /^[A-Z0-9\- ]{5,15}$/i;
const licenseRegex = /^[A-Z0-9\-]{5,20}$/i;

/* ========================= LOCATION POINT (TRACKING) ========================= */
const locationPointSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    latitude: { type: Number, min: -90, max: 90, required: true },
    longitude: { type: Number, min: -180, max: 180, required: true },
  },
  { _id: false }
);

/* ========================= PICKUP / DESTINATION ========================= */
const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { _id: false }
);

/* ========================= DRIVER (OPTIONAL) ========================= */
const driverSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 50 },
    contactNumber: {
      type: String,
      match: [phoneRegex, 'Contact must be 10 digits'],
    },
    vehicleNumber: {
      type: String,
      trim: true,
      match: [plateRegex, 'Invalid vehicle number'],
    },
    aadhar: {
      type: String,
      match: [aadharRegex, 'Aadhar must be 12 digits'],
    },
    licence: {
      type: String,
      trim: true,
      match: [licenseRegex, 'Invalid licence number'],
    },
  },
  { _id: false }
);

/* ========================= RIDE SCHEMA ========================= */
const rideSchema = new mongoose.Schema(
  {
    pickup: {
      type: placeSchema,
      required: [true, 'Pickup location is required'],
    },
    destination: {
      type: placeSchema,
      required: [true, 'Destination location is required'],
    },
    rideType: {
      type: String,
      enum: ['cab', 'travelBuddy'],
      required: [true, 'Ride type is required'],
    },
    departureTime: {
      type: Date,
      required: [true, 'Departure time is required'],
      validate: {
        validator: (v) => v && v.getTime() >= Date.now(),
        message: 'Departure time must be in the future',
      },
    },
    notes: {
      type: String,
      trim: true,
      minlength: [3, 'Description must be at least 300 characters'],
      maxlength: [400, 'Description cannot exceed 400 characters'],
      // Conditional requirement based on rideType (handled in application logic)
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      min: [1, 'At least 1 seat must be available'],
      max: [8, 'Seats cannot exceed 8'],
    },
    fare: {
      type: Number,
      min: [0, 'Fare cannot be negative'],
      // Optional field
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    locationHistory: [locationPointSchema],
    driver: {
      type: driverSchema,
      validate: {
          validator: function (value) {
            if (this.rideType === 'cab') {
                  return value != null;
               }
                return true; // travelBuddy doesn't need driver
             },
          message: 'Driver details are required for cab rides',
          },
           }, // optional
  },
  { timestamps: true }
);

/* ========================= INDEXES (VERY IMPORTANT) ========================= */
// rideSchema.index({ 'pickup.location': '2dsphere' });
// rideSchema.index({ 'destination.location': '2dsphere' });
// rideSchema.index({ 'pickup.name': 'text', 'destination.name': 'text' });
rideSchema.index({ "pickup.location": "2dsphere" });
rideSchema.index({ rideType: 1 });
rideSchema.index({ initiatorId: 1 });
rideSchema.index({ "pickup.name": 1 });
rideSchema.index({ "destination.name": 1 });

/* ========================= VIRTUAL ID ========================= */
rideSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
rideSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ride', rideSchema);