const User = require("../models/User");
const sendMail = require("../config/mailer"); // ✅ moved to top, no .default

const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) return res.status(400).json({ message: "User already verified" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // ✅ consistent with signup.js

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  try {
    await sendMail({
      to: email,
      subject: "Your Travio verification code (Resent)",
      text: `Your new OTP is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your new OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    });
  } catch (mailErr) {
    console.error("Error sending OTP email:", mailErr);
    return res.status(500).json({ message: "Failed to resend OTP. Please try again." }); // ✅ actually return error to frontend
  }

  res.json({ success: true, message: "OTP resent successfully" });
};

module.exports = resendOtp;