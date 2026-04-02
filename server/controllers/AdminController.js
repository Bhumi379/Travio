const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Ride = require('../models/Ride');
const User = require('../models/User');
const RideRequest = require('../models/RideRequest');
const {
  ensureAboutDocument,
} = require('./aboutContentHelper');


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
  try {
    const rides = await Ride.find()
      .populate('initiatorId', 'name email collegeId contactNumber guardianNumber profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    const rideIds = rides.map((r) => r._id);

    const accepted = await RideRequest.find({
      rideId: { $in: rideIds },
      status: 'accepted',
    })
      .populate('userId', 'name email collegeId contactNumber guardianNumber profilePicture')
      .select('rideId userId')
      .lean();

    const byRide = new Map();
    accepted.forEach((rr) => {
      const key = String(rr.rideId);
      const arr = byRide.get(key) || [];
      arr.push(rr.userId);
      byRide.set(key, arr);
    });

    const out = rides.map((r) => {
      const pax = byRide.get(String(r._id)) || [];
      return {
        ...r,
        acceptedParticipants: pax,
        participantCount: pax.length,
      };
    });

    res.json(out);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching rides', error: error.message });
  }
};

/* ================= GET SINGLE RIDE (DETAILS) ================= */
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('initiatorId', 'name email collegeId contactNumber guardianNumber profilePicture')
      .lean();

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const accepted = await RideRequest.find({
      rideId: ride._id,
      status: 'accepted',
    })
      .populate('userId', 'name email collegeId contactNumber guardianNumber profilePicture')
      .select('userId')
      .lean();

    const participants = accepted.map((r) => r.userId);

    res.json({
      success: true,
      data: {
        ...ride,
        acceptedParticipants: participants,
        participantCount: participants.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching ride details', error: error.message });
  }
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

/* ================= GET USER BY ID ================= */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
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

/* ================= ABOUT PAGE (ADMIN) — structured ================= */
exports.getAboutContent = async (req, res) => {
  try {
    const doc = await ensureAboutDocument();
    const plain = doc.toObject ? doc.toObject() : doc;
    res.json({ success: true, data: plain });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching about content',
      error: error.message,
    });
  }
};

exports.updateAboutContent = async (req, res) => {
  try {
    const {
      pageTitle,
      pageSubtitle,
      busSchedules,
      niwaiSlots,
      metroDidi,
      trustedDrivers,
    } = req.body;

    const doc = await ensureAboutDocument();
    if (typeof pageTitle === 'string') doc.pageTitle = pageTitle;
    if (typeof pageSubtitle === 'string') doc.pageSubtitle = pageSubtitle;
    if (Array.isArray(busSchedules)) doc.busSchedules = busSchedules;
    if (Array.isArray(niwaiSlots)) doc.niwaiSlots = niwaiSlots;
    if (Array.isArray(metroDidi)) doc.metroDidi = metroDidi;
    if (Array.isArray(trustedDrivers)) doc.trustedDrivers = trustedDrivers;

    doc.updatedByAdminId = req.admin?.id || null;
    if (doc.html == null) doc.html = '';
    await doc.save();

    const plain = doc.toObject();
    res.json({
      success: true,
      message: 'Information page updated',
      data: plain,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating about content',
      error: error.message,
    });
  }
};