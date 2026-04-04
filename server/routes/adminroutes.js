const express = require('express');
const router = express.Router();

const { adminLogin, adminSignup } = require('../controllers/AdminController');
const { getAllRides, getRideById, deleteRide } = require('../controllers/AdminController');
<<<<<<< HEAD
const { updateRide } = require('../controllers/rideController');
const adminUpdateRide = updateRide;
=======
>>>>>>> 7ee0f4f62edcc7304360ae62f490a9e1976209a5
const adminAuth = require('../middleware/adminAuth');
const { getAllUsers, getUserById, deleteUser } = require('../controllers/AdminController');
const { getAllAdmins } = require('../controllers/AdminController');
const { getAboutContent, updateAboutContent } = require('../controllers/AdminController');

// public
router.post('/login', adminLogin);

// protected
router.post('/signup', adminAuth, adminSignup);

router.get('/dashboard', adminAuth, (req, res) => {
  res.json({ message: 'Welcome to Admin Dashboard' });
});

/* ================= RIDES ================= */
router.get('/rides', adminAuth, getAllRides);
router.get('/rides/:id', adminAuth, getRideById);
router.delete('/rides/:id', adminAuth, deleteRide);

// ================= USERS =================
router.get('/users', adminAuth, getAllUsers);
router.get('/users/:id', adminAuth, getUserById);
router.delete('/users/:id', adminAuth, deleteUser);

// ================= ADMINS =================
router.get('/admins', adminAuth, getAllAdmins);

// ================= ABOUT (Dynamic) =================
router.get('/about', adminAuth, getAboutContent);
router.put('/about', adminAuth, updateAboutContent);

module.exports = router;