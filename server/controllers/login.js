const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createSecretToken } = require("../tokenGeneration/generateToken");
const sendMail = require("../config/mailer");




const login = async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).json({ message: "All input is required" });
  }

  // Restrict login to campus emails only
  if (!String(email).toLowerCase().endsWith("@banasthali.in")) {
    return res.status(400).json({ message: "Email must end with @banasthali.in" });
  }
  const user = await User.findOne({ email }).select("+hashedPassword");//hashedPassword not by default ;
  if (!user) return res.status(404).json({ message: "Invalid credentials" });
  if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });
  if (!(await bcrypt.compare(password, user.hashedPassword))) {
    return res.status(404).json({ message: "Invalid credentials" });
  }

  const token = createSecretToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({ token });
};



const forgotPassword = async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpire = Date.now() + 3600000; // 1 hour

  await user.save();

  const resetLink =
    `http://localhost:5000/reset-password.html?token=${token}`;

  try {

    await sendMail({
      to: user.email,
      subject: "Travio Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    res.json({
      message: "Password reset link sent to your email"
    });

  } catch (err) {

    console.error("Email error:", err);

    res.status(500).json({
      message: "Failed to send reset email"
    });
  }

};
const resetPassword = async (req, res) => {

  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() }
  }).select("+resetToken +hashedPassword"); // ✅ FIX

  if (!user) {
    return res.status(400).json({
      message: "Token expired or invalid"
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user.hashedPassword = hashedPassword;

  user.resetToken = undefined;
  user.resetTokenExpire = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
};
module.exports = {
  login,
  forgotPassword,
  resetPassword
};