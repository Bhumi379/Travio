const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
router.use((req, _res, next) => {
  console.log('[reviews router]', req.method, req.originalUrl);
  next();
});


const {
  getAllReviews,
  getReviewById,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

router.get('/', getAllReviews);
router.get('/user/:userId', getReviewsByUser);
router.get('/:id', getReviewById);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
