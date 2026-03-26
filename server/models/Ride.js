const mongoose = require('mongoose');

/* ========================= REGEX ========================= */
const phoneRegex = /^[0-9]{10}$/;
const aadharRegex = /^[0-9]{12}$/;
const plateRegex = /^[A-Z0-9\- ]{5,15}$/i;
const licenseRegex = /^[A-Z0-9\-]{5,20}$/i;

/* ========================= LOCATION ========================= */
const locationPointSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    latitude:  { type: Number, min: -90,  max: 90,  required: true },
    longitude: { type: Number, min: -180, max: 180, required: true },
  },
  { _id: false }
);

/* ========================= PLACE ========================= */
const placeSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    location: {
      type:        { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  { _id: false }
);

/* ========================= DRIVER ========================= */
const driverSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },

    contactNumber: {
      type:  String,
      match: [phoneRegex, 'Contact must be 10 digits'],
    },

    vehicleNumber: {
      type:  String,
      trim:  true,
      match: [plateRegex, 'Invalid vehicle number'],
    },

    aadhar: {
      type:  String,
      match: [aadharRegex, 'Aadhar must be 12 digits'],
    },

    licence: {
      type:  String,
      trim:  true,
      match: [licenseRegex, 'Invalid licence number'],
    },

    // ✅ Cloudinary image URLs
    driverLicenseImage: { type: String, default: null },
    aadharImage:        { type: String, default: null },
  },
  { _id: false }
);

/* ========================= RIDE ========================= */
const rideSchema = new mongoose.Schema(
  {
    pickup:      { type: placeSchema, required: true },
    destination: { type: placeSchema, required: true },

    rideType: {
      type:     String,
      enum:     ['cab', 'travelBuddy'],
      required: true,
    },

    departureTime: {
      type:     Date,
      required: true,
      validate: {
        validator: (v) => v && v.getTime() >= Date.now(),
        message:   'Departure time must be in the future',
      },
    },

    notes: {
      type:      String,
      trim:      true,
      // ✅ Fixed - 300 min was too strict
      minlength: [3,   'Notes must be at least 3 characters'],
      maxlength: [400, 'Notes cannot exceed 400 characters'],
    },

    status: {
      type:    String,
      enum:    ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },

    initiatorId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    seats: {
      type:     Number,
      required: true,
      min:      1,
      max:      8,
    },

    fare: {
      type: Number,
      min:  0,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],

    locationHistory: [locationPointSchema],

    // ✅ Driver - fully optional
    driver: {
      type:    driverSchema,
      default: null,
    },
  },
  { timestamps: true }
);

/* ========================= INDEXES ========================= */
rideSchema.index({ "pickup.location":      "2dsphere" });
rideSchema.index({ "destination.location": "2dsphere" });

/* ========================= VIRTUAL ========================= */
rideSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

rideSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ride', rideSchema);