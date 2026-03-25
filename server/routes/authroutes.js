const express = require("express");
const router = express.Router();

// Imports
const { login, forgotPassword, resetPassword } = require("../controllers/login");
const createUser = require("../controllers/signup");
const verifyOtp = require("../controllers/verifyOtp");
const resendOtp = require("../controllers/resendOtp");
const authMiddleware = require("../middleware/authmiddleware");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { updateUser } = require("../controllers/userController");

// ---------------- AUTH ROUTES ----------------
router.post("/signup", createUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// ---------------- PROTECTED ROUTE ----------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-hashedPassword");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      profilePicture,
      password, // if provided, re-hash
    } = req.body;

    const user = await User.findById(req.user.id).select('+hashedPassword');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Unique checks if fields changed (skip collegeId for /me)
    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already exists' });
      }
      user.email = email.toLowerCase();
    }

    if (contactNumber && contactNumber !== user.contactNumber) {
      const exists = await User.findOne({ contactNumber });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Contact number already in use',
        });
      }
      user.contactNumber = contactNumber;
    }

    if (name !== undefined) user.name = name;
    if (guardianNumber !== undefined) user.guardianNumber = guardianNumber;
    if (course !== undefined) user.course = course;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.hashedPassword = await bcrypt.hash(String(password), salt);
    }

    await user.validate(); // run schema validators
    const updated = await user.save();

    // Return without hashedPassword
    const userResponse = updated.toObject();
    delete userResponse.hashedPassword;

    res
      .status(200)
      .json({ success: true, message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res
        .status(400)
        .json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
});

module.exports = router;