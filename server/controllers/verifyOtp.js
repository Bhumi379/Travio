const User = require("../models/User");

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

  const user = await User.findOne({ email }).select('+otp +otpExpiry +isVerified');
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) return res.status(400).json({ message: "User already verified" });

  if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: "No OTP found. Request a new one." });

  if (Date.now() > user.otpExpiry.getTime()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ success: true, message: "Email verified successfully" });
};

module.exports = verifyOtp;
