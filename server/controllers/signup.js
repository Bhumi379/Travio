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
      profilePicture,
      password,
    } = req.body;

    // ------------------ VALIDATION --------------------
    if (!collegeId || !name || !contactNumber || !email || !course || !password) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    // Restrict signup to campus emails only
    if (!String(email).toLowerCase().endsWith("@banasthali.in")) {
      return res.status(400).json({ message: "Email must end with @banasthali.in" });
    }

    // ------------------ CHECK IF USER EXISTS ------------------
    const oldUser = await User.findOne({ email });


    if (oldUser) {
      // If already verified → block
      if (oldUser.isVerified) {
        return res.status(409).json({
          message: "User already exists. Please login.",
        });
      }

      // If NOT verified → resend OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      oldUser.otp = otp;
      oldUser.otpExpiry = otpExpiry;

      await oldUser.save();

      try {
        

        const subject = "Your Travio verification code (Resent)";
        const text = `Your OTP is ${otp}. It will expire in 10 minutes.`;
        const html = `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`;

        await sendMail(email, subject, html);


      } catch (mailErr) {
        console.error("Error resending OTP:", mailErr);

        return res.status(500).json({
          message: "Failed to resend OTP. Please try again.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP resent. Please verify your email.",
        email: oldUser.email,
      });
    }

    // ------------------ HASH PASSWORD ------------------
    

    const hashedPassword = await bcrypt.hash(password, 10);

    // ------------------ GENERATE OTP ------------------
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // ------------------ CREATE NEW USER ------------------
    const newUser = new User({
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      profilePicture,
      hashedPassword,
      isVerified: false,
      otp,
      otpExpiry,
    });

    const user = await newUser.save();

    // ------------------ SEND OTP EMAIL ------------------
    try {
      

      const subject = "Your Travio verification code";
      const text = `Your OTP is ${otp}. It will expire in 10 minutes.`;
      const html = `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`;

      await sendMail({
  to: email,
  subject,
  text,
  html,
});


    } catch (mailErr) {
      console.error("Error sending OTP email:", mailErr);

      await User.deleteOne({ _id: user._id });


      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(201).json({
      success: true,
      message: "User created. OTP sent to email. Verify to complete signup.",
      email: user.email,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = createUser;
