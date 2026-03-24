const Review = require('../models/review');

// GET /api/reviews
const getAllReviews = async (_req, res) => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};

// GET /api/reviews/:id
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching review', error: error.message });
  }
};

// GET /api/reviews/user/:userId
const getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user reviews', error: error.message });
  }
};

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;
    const { rating, comment } = req.body;

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const review = await Review.create({
      userId: authUserId,
      rating,
      comment,
    });

    res.status(201).json({ success: true, message: 'Review created', data: review });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
};

// PUT /api/reviews/:id  (allow updating rating/comment only)
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const updated = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Review updated', data: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting review', error: error.message });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
};
