const express = require("express");
const router = express.Router();

// ✅ Correct imports
const { login, forgotPassword, resetPassword } = require("../controllers/login");
const createUser = require("../controllers/signup");
const verifyOtp = require("../controllers/verifyOtp");
const resendOtp = require("../controllers/resendOtp");
const authMiddleware = require("../middleware/authmiddleware");
const User = require("../models/User");

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

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:token", resetPassword);

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
  }
});

// ✅ VERY IMPORTANT (final fix)
module.exports = router;