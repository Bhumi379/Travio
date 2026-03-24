const express = require('express');
const router = express.Router();

const protect = require('../middleware/authmiddleware');
const {
  sendJoinRequest,
  getRideRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  getUserRequestStatus,
} = require('../controllers/rideRequestController');

// TEST: Unprotected version to debug route matching
router.post('/:rideId/request-unprotected', (req, res) => {
  console.log('[UNPROTECTED TEST] POST received for rideId:', req.params.rideId);
  console.log('[UNPROTECTED TEST] Full URL:', req.originalUrl);
  console.log('[UNPROTECTED TEST] Path:', req.path);
  res.json({ success: true, message: 'unprotected test ok', rideId: req.params.rideId });
});

// Send a join request for a ride
router.post('/:rideId/request', protect, (req, res, next) => {
  console.log('[REQUEST-PROTECTED] POST received for rideId:', req.params.rideId);
  console.log('[REQUEST-PROTECTED] User ID:', req.user?.id || req.user?._id || 'unknown');
  sendJoinRequest(req, res, next);
});




// Get request status for a ride (check if user already requested)
router.get('/:rideId/request-status', protect, getUserRequestStatus);

// Get all requests for a ride (only ride creator can view)
router.get('/:rideId/requests', protect, async (req, res, next) => {
  console.log("📩 Incoming GET /ride-requests/:rideId/requests");
  console.log("rideId:", req.params.rideId);
  console.log("user from middleware:", req.user);
  next(); // pass to controller
}, getRideRequests);

// Get all requests for a ride (only ride creator can view)
router.get('/:rideId/requests', protect, getRideRequests);

// Accept a join request
router.put('/:rideId/requests/:requestId/accept', protect, acceptJoinRequest);

// Reject a join request
router.put('/:rideId/requests/:requestId/reject', protect, rejectJoinRequest);

module.exports = router;
