const mongoose = require('mongoose');

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // simple RFC-like check
const phoneRegex = /^[0-9]{10}$/;
const urlRegex =
  /^(https?:\/\/)?([^\s.]+\.[^\s]{2,}|localhost)(:[0-9]{2,5})?(\/[^\s]*)?$/i;

const userSchema = new mongoose.Schema(
  {
    collegeId: {
      type: String,
      required: [true, 'College ID is required'],
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },

    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      match: [phoneRegex, 'Contact number must be 10 digits'],
    },

    guardianNumber: {
      type: String,
      trim: true,
      match: [phoneRegex, 'Guardian number must be 10 digits'],
      required: false,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    
      match: [/^[a-zA-Z0-9._%+-]+@banasthali\.in$/, 'Email must be a valid Banasthali email address'],
    },

    // NEW: course (as asked)
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      maxlength: [100, 'Course cannot be more than 100 characters'],
    },

    profilePicture: {
      type: String,
      trim: true,
      match: [urlRegex, 'Profile picture must be a valid URL'],
      required: false,
    },

    hashedPassword: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never return by default
    },
  },
  {
    timestamps: true, // createdAt default now(), updatedAt auto-updates
  }
);

// Virtual id -> _id as string
//MongoDB stores _id by default (with underscore). Sometimes you want id without underscore
userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.hashedPassword; // extra safety
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

