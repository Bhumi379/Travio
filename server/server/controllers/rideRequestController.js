const RideRequest = require('../models/RideRequest');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

/* =====================================================
   SEND JOIN REQUEST
===================================================== */
const sendJoinRequest = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if user is the ride creator (convert both to strings for comparison)
    if (ride.initiatorId && ride.initiatorId.toString() === String(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request your own ride',
      });
    }

    // Check if request already exists
    const existingRequest = await RideRequest.findOne({
      rideId,
      userId,
    });

    if (existingRequest) {
      // If there's a pending request, deny it
      if (existingRequest.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending request for this ride',
        });
      }
      
      // If request was accepted, deny new request
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'You have already been accepted for this ride',
        });
      }
      
      // If request was rejected, delete the old one and create a new one
      if (existingRequest.status === 'rejected') {
        await RideRequest.findByIdAndDelete(existingRequest._id);
      }
    }

    // Create request
    const rideRequest = new RideRequest({
      rideId,
      userId,
      message,
    });

    await rideRequest.save();

    // Create notification for ride creator
    const user = await User.findById(userId);
    const notificationMessage = `${user.name} has requested to join your ride`;

    const notificationCreated = await createNotification(
      ride.initiatorId,
      userId,
      rideId,
      'join_request',
      notificationMessage
    );

    console.log('Notification sent to:', ride.initiatorId, 'Result:', !!notificationCreated);

    res.status(201).json({
      success: true,
      message: 'Join request sent successfully',
      data: rideRequest,
    });
  } catch (err) {
    console.error('Error in sendJoinRequest:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending join request',
      error: err.message,
    });
  }
};

/* =====================================================
   GET JOIN REQUESTS FOR A RIDE
===================================================== */
const getRideRequests = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    // Verify user owns the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.initiatorId.toString() !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only view requests for your own rides',
      });
    }

    // Get all requests for this ride
    const requests = await RideRequest.find({ rideId })
      .populate('userId', 'name email profilePicture contactNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching join requests',
      error: err.message,
    });
  }
};

/* =====================================================
   ACCEPT JOIN REQUEST
===================================================== 
const acceptJoinRequest = async (req, res) => {
  try {
    const { rideId, requestId } = req.params;
    const userId = req.user.id;

    // Verify ride owner
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.initiatorId.toString() !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage requests for your own rides',
      });
    }

    // Find and update request
    const rideRequest = await RideRequest.findByIdAndUpdate(
      requestId,
      { status: 'accepted' },
      { new: true }
    ).populate('userId', 'name email');

    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // Create notification for requester
    const user = await User.findById(userId);
    const notificationMessage = `Your request to join ${ride.pickup?.name || 'the ride'} has been accepted`;

    const notificationCreated = await createNotification(
      rideRequest.userId,
      userId,
      rideId,
      'request_accepted',
      notificationMessage
    );

    console.log('Acceptance notification sent to:', rideRequest.userId, 'Result:', !!notificationCreated);

    res.json({
      success: true,
      message: 'Join request accepted',
      data: rideRequest,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error accepting request',
      error: err.message,
    });
  }
}; 
*/

const acceptJoinRequest = async (req, res) => {
  try {



    console.log("🟢 /accept endpoint hit");
    console.log("rideId:", req.params.rideId);
    console.log("requestId:", req.params.requestId);
    console.log("req.user:", req.user);

    const { rideId, requestId } = req.params;
    const userId = req.user.id;

    // Verify ride owner
    const ride = await Ride.findById(rideId);
    if (!ride)
      return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.initiatorId.toString() !== String(userId))
      return res.status(403).json({
        success: false,
        message: 'You can only manage requests for your own rides',
      });

    // Find and update request
    const rideRequest = await RideRequest.findByIdAndUpdate(
      requestId,
      { status: 'accepted' },
      { new: true }
    ).populate('userId', 'name email');

    if (!rideRequest)
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });

    if (ride.seats && Number(ride.seats) > 0) {
  ride.seats = Number(ride.seats) - 1;
  // Disable full validation so past departureTime doesn’t break the save
  await ride.save({ validateBeforeSave: false });
} else {
  return res.status(400).json({
    success: false,
    message: 'No available seats left',
  });
}


    // Send notification
    const owner = await User.findById(userId);
    const notificationMessage = `Your request to join ${ride.pickup?.name || 'the ride'} has been accepted`;
    await createNotification(
      rideRequest.userId,
      userId,
      rideId,
      'request_accepted',
      notificationMessage
    );

    res.status(200).json({
      success: true,
      message: 'Join request accepted, seat updated, and notification sent',
      data: rideRequest,
    });
  } catch (err) {
    console.error('Error in acceptJoinRequest:', err);
    res.status(500).json({
      success: false,
      message: 'Error accepting request',
      error: err.message,
    });
  }
};

/* =====================================================
   REJECT JOIN REQUEST
===================================================== 
const rejectJoinRequest = async (req, res) => {
  try {
    const { rideId, requestId } = req.params;
    const userId = req.user.id;

    // Verify ride owner
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.initiatorId.toString() !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage requests for your own rides',
      });
    }

    // Find and update request
    const rideRequest = await RideRequest.findByIdAndUpdate(
      requestId,
      { status: 'rejected' },
      { new: true }
    ).populate('userId', 'name email');

    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // Create notification for requester
    const user = await User.findById(userId);
    const notificationMessage = `Your request to join ${ride.pickup?.name || 'the ride'} has been rejected`;

    const notificationCreated = await createNotification(
      rideRequest.userId,
      userId,
      rideId,
      'request_rejected',
      notificationMessage
    );

    console.log('Rejection notification sent to:', rideRequest.userId, 'Result:', !!notificationCreated);

    res.json({
      success: true,
      message: 'Join request rejected',
      data: rideRequest,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: err.message,
    });
  }
};
*/
const rejectJoinRequest = async (req, res) => {
  try {
    const { rideId, requestId } = req.params;
    const userId = req.user.id;

    // Verify ride owner
    const ride = await Ride.findById(rideId);
    if (!ride)
      return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.initiatorId.toString() !== String(userId))
      return res.status(403).json({
        success: false,
        message: 'You can only manage requests for your own rides',
      });

    // Find and update request
    const rideRequest = await RideRequest.findByIdAndUpdate(
      requestId,
      { status: 'rejected' },
      { new: true }
    ).populate('userId', 'name email');

    if (!rideRequest)
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });

    // Send notification
    const owner = await User.findById(userId);
    const notificationMessage = `Your request to join ${ride.pickup?.name || 'the ride'} has been rejected`;
    await createNotification(
      rideRequest.userId,
      userId,
      rideId,
      'request_rejected',
      notificationMessage
    );

    res.status(200).json({
      success: true,
      message: 'Join request rejected and user notified',
      data: rideRequest,
    });
  } catch (err) {
    console.error('Error in rejectJoinRequest:', err);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: err.message,
    });
  }
};

/* =====================================================
   GET USER'S REQUEST STATUS FOR A RIDE
===================================================== */
const getUserRequestStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    const rideRequest = await RideRequest.findOne({
      rideId,
      userId,
    }).lean();

    res.json({
      success: true,
      hasRequest: !!rideRequest,
      data: rideRequest || null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching request status',
      error: err.message,
    });
  }
};

module.exports = {
  sendJoinRequest,
  getRideRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  getUserRequestStatus,
};
