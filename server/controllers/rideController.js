const Ride = require("../models/Ride");
const RideRequest = require("../models/RideRequest");
const { createNotification } = require("./notificationController");

console.log("✅ rideController loaded");
/* =====================================================
   GET ALL RIDES (GEO + FILTERS + EFFICIENT SEARCH)
   /api/rides?lat=&lng=&distance=&type=&search=
===================================================== */
const getAllRides = async (req, res) => {
  try {
    const { pickup, destination, date, lat, lng, distance = 5000 } = req.query;

    let matchQuery = {};

    // Pickup search
    if (pickup) {
      matchQuery["pickup.name"] = { $regex: pickup, $options: "i" };
    }

    // Destination search
    if (destination) {
      matchQuery["destination.name"] = { $regex: destination, $options: "i" };
    }

    // Date filter (same day)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      matchQuery.departureTime = { $gte: start, $lte: end };
    }

    // GEO search (pickup-based)
    if (lat && lng) {
      const rides = await Ride.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
            distanceField: "distance",
            maxDistance: Number(distance),
            spherical: true,
            query: matchQuery,
          },
        },
        { $sort: { departureTime: 1 } },
      ]);

      return res.json({ success: true, count: rides.length, data: rides });
    }

    // Normal search (no geo)
    const rides = await Ride.find(matchQuery)
      .sort({ departureTime: 1 })
      .lean();

    res.json({ success: true, count: rides.length, data: rides });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching rides",
      error: err.message,
    });
  }
};

/* =====================================================
   GET SINGLE RIDE
===================================================== */
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).lean();

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ride",
      error: error.message,
    });
  }
};

/* =====================================================
   CREATE RIDE
===================================================== */
const createRide = async (req, res) => {
  try {
    console.log("🔥 CREATE RIDE CONTROLLER HIT");

    const ride = await Ride.create({
      ...req.body,
      initiatorId: req.user.id || req.user._id, // 🔥 FIX
    });

    res.status(201).json({
      success: true,
      message: "Ride created successfully",
      data: ride,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating ride",
      error: error.message,
    });
  }
};


/* =====================================================
   UPDATE RIDE
===================================================== */
const updateRide = async (req, res) => {
  try {
    const updatedRide = await Ride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedRide) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ride updated successfully",
      data: updatedRide,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating ride",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE RIDE
===================================================== */
const deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ride deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting ride",
      error: error.message,
    });
  }
};

const cancelRideByOwner = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id: rideId } = req.params;
    const ride = await Ride.findById(rideId).lean();

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (String(ride.initiatorId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride creator can cancel this ride",
      });
    }

    const acceptedRequests = await RideRequest.find({
      rideId,
      status: "accepted",
    }).select("userId");

    const participants = acceptedRequests
      .map((r) => r.userId)
      .filter((uid) => String(uid) !== String(userId));

    await Promise.all(
      participants.map((participantId) =>
        createNotification(
          participantId,
          userId,
          rideId,
          "ride_cancelled",
          `A ride you joined (${ride.pickup?.name || "Pickup"} to ${ride.destination?.name || "Destination"}) was cancelled by the creator`
        )
      )
    );

    await RideRequest.deleteMany({ rideId });
    await Ride.findByIdAndDelete(rideId);

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling ride",
      error: error.message,
    });
  }
};

const removeParticipantFromRide = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id: rideId, participantUserId } = req.params;

    const ride = await Ride.findById(rideId).lean();
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (String(ride.initiatorId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride creator can remove participants",
      });
    }

    const acceptedRequest = await RideRequest.findOne({
      rideId,
      userId: participantUserId,
      status: "accepted",
    });

    if (!acceptedRequest) {
      return res.status(404).json({
        success: false,
        message: "Participant not found in this ride",
      });
    }

    await RideRequest.findByIdAndDelete(acceptedRequest._id);

    if (typeof ride.seats === "number") {
      await Ride.findByIdAndUpdate(rideId, {
        $set: { seats: Number(ride.seats) + 1 },
      });
    }

    await createNotification(
      participantUserId,
      userId,
      rideId,
      "removed_from_ride",
      `You were removed from a ride (${ride.pickup?.name || "Pickup"} to ${ride.destination?.name || "Destination"}) by the creator`
    );

    return res.status(200).json({
      success: true,
      message: "Participant removed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error removing participant",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RIDES BY USER
===================================================== */
const getRidesByUser = async (req, res) => {
  try {
    const rides = await Ride.find({
      initiatorId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user rides",
      error: error.message,
    });
  }
};

/* =====================================================
   GET MY RIDES (CREATED + JOINED)
===================================================== */
const getMyRides = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [createdRides, acceptedRequests] = await Promise.all([
      Ride.find({ initiatorId: userId }).lean(),
      RideRequest.find({ userId, status: "accepted" }).select("rideId").lean(),
    ]);

    const joinedRideIds = acceptedRequests.map((reqDoc) => reqDoc.rideId);
    const joinedRides = joinedRideIds.length
      ? await Ride.find({ _id: { $in: joinedRideIds } }).lean()
      : [];

    const normalizeRide = (ride, role) => ({
      ...ride,
      role,
    });

    const createdWithRole = createdRides.map((ride) =>
      normalizeRide(ride, "creator")
    );
    const joinedWithRole = joinedRides
      .filter(
        (ride) => String(ride.initiatorId) !== String(userId)
      )
      .map((ride) => normalizeRide(ride, "participant"));

    const rideMap = new Map();
    [...createdWithRole, ...joinedWithRole].forEach((ride) => {
      rideMap.set(String(ride._id), ride);
    });

    const myRides = Array.from(rideMap.values()).sort(
      (a, b) =>
        new Date(b.departureTime || b.createdAt) -
        new Date(a.departureTime || a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: myRides.length,
      data: myRides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching your rides",
      error: error.message,
    });
  }
};

module.exports = {
  getAllRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  cancelRideByOwner,
  removeParticipantFromRide,
  getRidesByUser,
  getMyRides,
};
