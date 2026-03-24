import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const resetPassword = async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("MongoDB connected");

    const newPassword = 'Admin@123'; // your new password
    const hashed = await bcrypt.hash(newPassword, 12);

    await Admin.updateOne(
      { email: 'admin@banasthali.in' },
      { $set: { Password: hashed } }
    );

    console.log('Password reset successfully to Admin@123');
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

resetPassword();
