const express = require("express");
const router = express.Router();

const login = require("../controllers/login");
const createUser = require("../controllers/signup");
const verifyOtp = require("../controllers/verifyOtp");
const resendOtp = require("../controllers/resendOtp");
const authMiddleware = require("../middleware/authmiddleware");
const User = require("../models/User");

const bcrypt = require("bcryptjs");



// ---------------- AUTH ROUTES ----------------

// Signup
router.post("/signup", createUser);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtp);

// Login
router.post("/login", login);

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// ---------------- PROTECTED ROUTE ----------------

// Get logged-in user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-hashedPassword");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({ user });

  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({
      message: "Server error",
    });
<<<<<<< HEAD
  }
});

// Update logged-in user profile
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, contactNumber, guardianNumber, password } = req.body;

    const user = await User.findById(userId).select("+hashedPassword");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) user.name = name;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (guardianNumber !== undefined) user.guardianNumber = guardianNumber;

    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    if (password && password.trim()) {
      user.hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    const safeUser = await User.findById(userId).select("-hashedPassword");
    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
=======
>>>>>>> 4f7add497b85b05eb7590c7b96a254948486a55f
  }
});

module.exports = router;
