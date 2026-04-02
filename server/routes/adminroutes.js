const express = require('express');
const router = express.Router();

const { adminLogin, adminSignup } = require('../controllers/AdminController');
const { getAllRides, getRideById, deleteRide } = require('../controllers/AdminController');
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