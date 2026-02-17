const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Ride = require('../models/Ride');
const User = require('../models/User');


/* ================= ADMIN LOGIN ================= */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
   console.log("LOGIN BODY:", req.body); // 👈 debugging

  const admin = await Admin.findOne({ email }).select('+Password');
  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }   

  const isMatch = await bcrypt.compare(password, admin.Password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
    // ✅ UPDATE LAST LOGIN HERE
  admin.lastLogin = new Date();
  await admin.save();

  const token = jwt.sign(
    { id: admin._id, role: 'admin' },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    sameSite: "lax",
     path: "/",
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({ message: "Admin login successful" });
};

/* ================= ADMIN SIGNUP (PROTECTED) ================= */
exports.adminSignup = async (req, res) => {
  try {
     console.log("SIGNUP BODY:", req.body);
    const { name, email, Password, contactNumber } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !Password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // 2️⃣ Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // 3️⃣ Create new admin
    const newAdmin = new Admin({
      name,
      email,
      Password: Password, // will be hashed by pre-save hook
      contactNumber: contactNumber || ''
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      adminId: newAdmin._id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= GET ALL RIDES ================= */
exports.getAllRides = async (req, res) => {
  const rides = await Ride.find()
    .populate('initiatorId', 'name email')
    .sort({ createdAt: -1 });

  res.json(rides);
};

/* ================= DELETE RIDE ================= */
exports.deleteRide = async (req, res) => {
  const { id } = req.params;

  await Ride.findByIdAndDelete(id);
  res.json({ message: 'Ride deleted successfully' });
};
/* ================= GET ALL USERS ================= */
exports.getAllUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
};

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  // Optional safety: remove user from rides
  await Ride.updateMany(
    { participants: id },
    { $pull: { participants: id } }
  );

  await Ride.deleteMany({ initiatorId: id }); // remove rides created by user
  await User.findByIdAndDelete(id);

  res.json({ message: 'User deleted successfully' });
};
/* ================= GET ALL ADMINS ================= */
exports.getAllAdmins = async (req, res) => {
  const admins = await Admin.find()
    .select('-Password')
    .sort({ createdAt: -1 });

  res.json(admins);
};