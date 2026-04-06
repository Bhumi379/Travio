const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendMail = require("../config/mailer");

const createUser = async (req, res) => {
  try {
    const {
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      password,
    } = req.body;

    if (!collegeId || !name || !contactNumber || !email || !course || !password) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Name validation - should not be empty and at least 2 characters
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      return res.status(400).json({ message: "Name should contain only letters and spaces" });
    }

    // Email validation - must be @banasthali.in
    const trimmedEmail = String(email).toLowerCase().trim();
    if (!trimmedEmail.endsWith("@banasthali.in")) {
      return res.status(400).json({ message: "Email must end with @banasthali.in" });
    }
    if (!/^[a-zA-Z0-9._%+-]+@banasthali\.in$/.test(trimmedEmail)) {
      return res.status(400).json({ message: "Email format is invalid" });
    }

    // Contact number validation - exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(String(contactNumber).trim())) {
      return res.status(400).json({ message: "Contact number must be exactly 10 digits" });
    }

    // Guardian number validation if provided - exactly 10 digits
    if (guardianNumber && String(guardianNumber).trim() !== "") {
      if (!phoneRegex.test(String(guardianNumber).trim())) {
        return res.status(400).json({ message: "Guardian number must be exactly 10 digits" });
      }
    }

    // Password validation - minimum 8 characters with mixed case and at least one number
    const passwordStr = String(password);
    if (passwordStr.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(passwordStr)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(passwordStr)) {
      return res.status(400).json({ message: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(passwordStr)) {
      return res.status(400).json({ message: "Password must contain at least one number" });
    }
    if (!/[!@#$%^&*]/.test(passwordStr)) {
      return res.status(400).json({ message: "Password must contain at least one special character (!@#$%^&*)" });
    }

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      if (oldUser.isVerified) {
        return res.status(409).json({ message: "User already exists. Please login." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      oldUser.otp = otp;
      oldUser.otpExpiry = otpExpiry;
      await oldUser.save();

      try {
        await sendMail({
          to: email,
          subject: "Your Travio verification code (Resent)",
          text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
          html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
        });
      } catch (mailErr) {
        console.error("Error resending OTP:", mailErr);
        return res.status(500).json({ message: "Failed to resend OTP. Please try again." });
      }

      return res.status(200).json({
        success: true,
        message: "OTP resent. Please verify your email.",
        email: oldUser.email,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = new User({
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      hashedPassword,
      isVerified: false,
      otp,
      otpExpiry,
    });

    const user = await newUser.save();

    try {
      await sendMail({
        to: email,
        subject: "Your Travio verification code",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
      });
    } catch (mailErr) {
      console.error("Error sending OTP email:", mailErr);
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(201).json({
      success: true,
      message: "User created. OTP sent to email. Verify to complete signup.",
      email: user.email,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createUser;