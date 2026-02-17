const User = require("../models/User");
const { createSecretToken } = require("../tokenGeneration/generateToken");
const bcrypt = require("bcryptjs");

const createUser = async (req, res) => {
  try {
    const {
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      profilePicture,
      password
    } = req.body;

    // ------------------ VALIDATION --------------------
    if (!collegeId || !name || !contactNumber || !email || !course || !password) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // ------------------ CHECK IF USER EXISTS ------------------
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).json({ message: "User already exists. Please login." });
    }

    // ------------------ HASH PASSWORD ------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ------------------ CREATE USER ------------------
    const newUser = new User({
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      profilePicture,
      hashedPassword
    });

    const user = await newUser.save();

    // ------------------ CREATE TOKEN ------------------
    const token = createSecretToken(user._id);

//     res.cookie("token", token, {
//   httpOnly: true,
//   secure: false,        // 👈 MUST be false on localhost
//   sameSite: "Lax",      // 👈 works on localhost
//   maxAge: 24 * 60 * 60 * 1000
// });
const isProd = process.env.NODE_ENV === "production";

res.cookie("token", token, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
  maxAge: 24 * 60 * 60 * 1000
});
    console.log("Cookie set successfully");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createUser;
