const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); //slow compared to  bcrypt  
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Admin full name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    match: [/^\S+@banasthali\.in$/, 'Please provide a valid email address']
  },
  contactNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  Password: {
  type: String,
  required: true,
  minlength: 8,
  select: false
},
lastLogin: {
  type: Date
}

}, {
  timestamps: true // automatically creates createdAt and updatedAt
});



adminSchema.pre('save', async function(next) {
  if (!this.isModified('Password')) return next();

  this.Password = await bcrypt.hash(this.Password, 12);
  next();
});
// Virtual field to return _id as a string(converting a complex ObjectId object into a string representation.)
adminSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are included in JSON
adminSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Admin', adminSchema);