const User = require("../models/User");

const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) return res.status(400).json({ message: "User already verified" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  try {
    const sendMail = require("../config/mailer");
    const subject = "Your Travio verification code (resend)";
    const text = `Your new OTP is ${otp}. It will expire in 10 minutes.`;
    const html = `<p>Your new OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`;
    await sendMail({ to: email, subject, text, html });
  } catch (mailErr) {
    console.error("Error sending OTP email:", mailErr);
  }

  res.json({ success: true, message: "OTP resent" });
};

module.exports = resendOtp;
