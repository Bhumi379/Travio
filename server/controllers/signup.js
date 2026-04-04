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

    if (!String(email).toLowerCase().endsWith("@banasthali.in")) {
      return res.status(400).json({ message: "Email must end with @banasthali.in" });
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