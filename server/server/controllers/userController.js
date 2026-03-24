const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createSecretToken } = require("../tokenGeneration/generateToken");

// GET /api/users
const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// POST /api/users
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
      password, // plain text from client
    } = req.body;

    // Uniqueness checks matching the table
    const existingByCollegeId = await User.findOne({ collegeId });
    if (existingByCollegeId) {
      return res
        .status(400)
        .json({ success: false, message: 'College ID already exists' });
    }

    const existingByEmail = await User.findOne({ email: email?.toLowerCase() });
    if (existingByEmail) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already exists' });
    }

    // Optional: prevent duplicate phone even if not required by table
    const existingByContact = await User.findOne({ contactNumber });
    if (existingByContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact number already in use',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password || ''), salt);

    const user = await User.create({
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      profilePicture,
      hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res
        .status(400)
        .json({ success: false, message: 'Validation Error', errors: messages });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const {
      collegeId,
      name,
      contactNumber,
      guardianNumber,
      email,
      course,
      profilePicture,
      password, // if provided, re-hash
    } = req.body;

    const user = await User.findById(req.params.id).select('+hashedPassword');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Unique checks if fields changed
    if (collegeId && collegeId !== user.collegeId) {
      const exists = await User.findOne({ collegeId });
      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: 'College ID already exists' });
      }
      user.collegeId = collegeId;
    }

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already exists' });
      }
      user.email = email.toLowerCase();
    }

    if (contactNumber && contactNumber !== user.contactNumber) {
      const exists = await User.findOne({ contactNumber });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Contact number already in use',
        });
      }
      user.contactNumber = contactNumber;
    }

    if (name !== undefined) user.name = name;
    if (guardianNumber !== undefined) user.guardianNumber = guardianNumber;
    if (course !== undefined) user.course = course;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.hashedPassword = await bcrypt.hash(String(password), salt);
    }

    await user.validate(); // run schema validators
    const updated = await user.save();

    res
      .status(200)
      .json({ success: true, message: 'User updated successfully', data: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res
        .status(400)
        .json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const exists = await User.findById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

