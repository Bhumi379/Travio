const mongoose = require("mongoose");
const Ride = require("../models/Ride");
const RideRequest = require("../models/RideRequest");
const { createNotification } = require("./notificationController");
const path = require("path");

/** Safe initiator id string from populated or raw ObjectId (avoids throwing on null / plain ObjectId). */
function initiatorIdStr(ride) {
  const i = ride?.initiatorId;
  if (i == null) return "";
  if (typeof i === "object" && i._id != null) return String(i._id);
  return String(i);
}

/** Profile sidebar: past = cancelled/completed or departure already passed; active = ongoing or future scheduled. */
function profileRideBucket(ride) {
  const st = String(ride.status || "scheduled").toLowerCase();
  if (st === "cancelled" || st === "completed") return "past";
  if (st === "ongoing") return "active";
  const t = new Date(ride.departureTime || ride.createdAt);
  if (Number.isNaN(t.getTime())) return "active";
  return t >= new Date() ? "active" : "past";
}

console.log("✅ rideController loaded");

function parseIfString(val) {
  if (val == null) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

function toPublicFileUrl(req, fileObj) {
  if (!fileObj) return null;
  if (fileObj.path && /^https?:\/\//i.test(fileObj.path)) return fileObj.path;
  if (fileObj.filename) {
    return `${req.protocol}://${req.get("host")}/uploads/${fileObj.filename}`;
  }
  if (fileObj.path && fileObj.path.includes(`${path.sep}uploads${path.sep}`)) {
    const fileName = path.basename(fileObj.path);
    return `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
  }
  return fileObj.path || null;
}
/* =====================================================
   GET ALL RIDES (GEO + FILTERS + EFFICIENT SEARCH)
   /api/rides?lat=&lng=&distance=&type=&search=
===================================================== */
const getAllRides = async (req, res) => {
  try {
    const {
      pickup,
      destination,
      date,
      lat,
      lng,
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      distance,
    } = req.query;

    // Meters. Default ~15 km so typed addresses match nearby pickups/destinations.
    const radiusM = Number(distance) > 0 ? Number(distance) : 15000;
    const earthRadiusM = 6378100;
    const sphereRad = radiusM / earthRadiusM;

    let matchQuery = {};

    // Pickup: prefer radius around geocoded point; else substring on name.
    const pLat = pickupLat || lat;
    const pLng = pickupLng || lng;
    const pLatNum = Number(pLat);
    const pLngNum = Number(pLng);
    if (pLat != null && pLng != null && pLat !== "" && pLng !== "" && Number.isFinite(pLatNum) && Number.isFinite(pLngNum)) {
      matchQuery["pickup.location"] = {
        $geoWithin: {
          $centerSphere: [[pLngNum, pLatNum], sphereRad],
        },
      };
    } else if (pickup) {
      matchQuery["pickup.name"] = { $regex: pickup, $options: "i" };
    }

    const dLatNum = Number(destLat);
    const dLngNum = Number(destLng);
    if (destLat != null && destLng != null && destLat !== "" && destLng !== "" && Number.isFinite(dLatNum) && Number.isFinite(dLngNum)) {
      matchQuery["destination.location"] = {
        $geoWithin: {
          $centerSphere: [[dLngNum, dLatNum], sphereRad],
        },
      };
    } else if (destination) {
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

    const rides = await Ride.find(matchQuery)
      .sort({ departureTime: 1 })
      .populate('initiatorId', 'name profilePicture')
      .lean();

    // Add initiatorName and initiatorProfilePicture to each ride for frontend compatibility
    const ridesWithInitiatorInfo = rides.map(ride => ({
      ...ride,
      initiatorName: ride.initiatorId?.name || 'Host',
      initiatorProfilePicture: ride.initiatorId?.profilePicture || null,
    }));

    res.json({ success: true, count: ridesWithInitiatorInfo.length, data: ridesWithInitiatorInfo });
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
    const ride = await Ride.findById(req.params.id)
      .populate("initiatorId", "name profilePicture")
      .lean();

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // SECURITY: Only ride participants should receive driver Aadhar/license download URLs.
    // We keep the ride visible but remove doc URLs for non-participants.
    const currentUserId = req.user?.id || req.user?._id;
    let canViewDriverDocs = false;

    const rideOwnerId = ride.initiatorId?._id || ride.initiatorId;
    if (currentUserId && rideOwnerId && String(rideOwnerId) === String(currentUserId)) {
      canViewDriverDocs = true;
    }

    if (!canViewDriverDocs && currentUserId && ride.rideType === "cab") {
      const acceptedReq = await RideRequest.findOne({
        rideId: ride._id,
        userId: currentUserId,
        status: "accepted",
      }).select("_id").lean();

      canViewDriverDocs = Boolean(acceptedReq);
    }

    if (!canViewDriverDocs && ride.rideType === "cab" && ride.driver) {
      ride.driver.driverLicenseImage = undefined;
      ride.driver.aadharImage = undefined;
    }

    res.status(200).json({
      success: true,
      data: {
        ...ride,
        initiatorName: ride.initiatorId?.name || "Host",
        initiatorProfilePicture: ride.initiatorId?.profilePicture || null,
      },
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

    // Parse JSON fields from FormData
    const rideData = {
      ...req.body,
      pickup: parseIfString(req.body.pickup),
      destination: parseIfString(req.body.destination),
      driver: parseIfString(req.body.driver),
      seats: req.body.seats != null && req.body.seats !== "" ? parseInt(req.body.seats, 10) : req.body.seats,
      fare: req.body.fare != null && req.body.fare !== "" ? parseFloat(req.body.fare) : req.body.fare,
    };

    // Handle file uploads
    if (req.files) {
      if (!rideData.driver) rideData.driver = {};
      if (req.files.license) {
        rideData.driver.driverLicenseImage = toPublicFileUrl(req, req.files.license[0]);
      }
      if (req.files.aadhar) {
        rideData.driver.aadharImage = toPublicFileUrl(req, req.files.aadhar[0]);
      }
    }

    if (rideData.rideType === "cab" && rideData.driver && typeof rideData.driver === "object") {
      const d = rideData.driver;
      const hasDriverInfo =
        (d.name && String(d.name).trim()) ||
        (d.vehicleNumber && String(d.vehicleNumber).trim()) ||
        (d.contactNumber && String(d.contactNumber).trim()) ||
        d.driverLicenseImage ||
        d.aadharImage;
      if (!hasDriverInfo) rideData.driver = null;
    }

    if (rideData.rideType === "travelBuddy") {
      delete rideData.seats;
      delete rideData.fare;
      rideData.driver = null;
    }

    const ride = await Ride.create({
      ...rideData,
      initiatorId: req.user.id || req.user._id,
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
function buildRideUpdateQuery(rawBody) {
  const updateData = { ...(rawBody || {}) };
  delete updateData.initiatorId;
  delete updateData._id;

  if (updateData.pickup != null) {
    updateData.pickup = parseIfString(updateData.pickup);
  }
  if (updateData.destination != null) {
    updateData.destination = parseIfString(updateData.destination);
  }
  if (updateData.driver != null && updateData.driver !== "") {
    updateData.driver = parseIfString(updateData.driver);
  }
  if (updateData.seats != null && updateData.seats !== "") {
    updateData.seats = parseInt(updateData.seats, 10);
  }
  if (updateData.fare != null && updateData.fare !== "") {
    updateData.fare = parseFloat(updateData.fare);
  }

  let updateQuery = updateData;
  if (updateData.rideType === "travelBuddy") {
    delete updateData.seats;
    delete updateData.fare;
    updateQuery = {
      ...updateData,
      driver: null,
      $unset: { seats: 1, fare: 1 },
    };
  }
  return updateQuery;
}

/**
 * Apply a patch from buildRideUpdateQuery onto a Mongoose document and save.
 * Uses doc.save() so validators that read this.rideType (e.g. fare, seats) work;
 * findByIdAndUpdate + runValidators often leaves this.rideType undefined for those paths.
 */
function applyRideUpdateQueryToDoc(doc, updateQuery) {
  const patch = { ...(updateQuery || {}) };
  const unset = patch.$unset;
  delete patch.$unset;

  for (const key of Object.keys(patch)) {
    doc.set(key, patch[key]);
  }
  if (unset && typeof unset === "object") {
    for (const key of Object.keys(unset)) {
      doc.set(key, undefined);
    }
  }
}

const updateRide = async (req, res) => {
  try {
    const existing = await Ride.findById(req.params.id).select("initiatorId").lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const uid = req.user?.id || req.user?._id;
    if (!uid || String(existing.initiatorId) !== String(uid)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride creator can update this ride",
      });
    }

    const doc = await Ride.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const updateQuery = buildRideUpdateQuery(req.body);
    applyRideUpdateQueryToDoc(doc, updateQuery);
    await doc.save();

    const updatedRide = doc.toObject({ virtuals: true });

    res.status(200).json({
      success: true,
      message: "Ride updated successfully",
      data: updatedRide,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating ride",
      error: error.message,
    });
  }
};

/** Same as updateRide but without owner check — use only behind adminAuth. */
const adminUpdateRide = async (req, res) => {
  try {
    const doc = await Ride.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const updateQuery = buildRideUpdateQuery(req.body);
    applyRideUpdateQueryToDoc(doc, updateQuery);
    await doc.save();

    const updatedRide = doc.toObject({ virtuals: true });

    res.status(200).json({
      success: true,
      message: "Ride updated successfully",
      data: updatedRide,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
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
      .populate('initiatorId', 'name profilePicture')
      .lean();

    const ridesWithInitiatorInfo = rides.map(ride => ({
      ...ride,
      initiatorName: ride.initiatorId?.name || 'Host',
      initiatorProfilePicture: ride.initiatorId?.profilePicture || null,
    }));

    res.status(200).json({
      success: true,
      count: ridesWithInitiatorInfo.length,
      data: ridesWithInitiatorInfo,
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
    const rawUserId = req.user?.id || req.user?._id;
    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.isValidObjectId(String(rawUserId))) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(String(rawUserId));
    const userIdStr = String(userObjectId);

    const [createdRides, acceptedRequests, participantRides] = await Promise.all([
      Ride.find({ initiatorId: userObjectId })
        .populate("initiatorId", "name profilePicture")
        .lean(),
      RideRequest.find({ userId: userObjectId, status: "accepted" })
        .select("rideId")
        .lean(),
      Ride.find({ participants: userObjectId })
        .populate("initiatorId", "name profilePicture")
        .lean(),
    ]);

    const joinedRideIds = acceptedRequests.map((reqDoc) => reqDoc.rideId);
    const joinedRides = joinedRideIds.length
      ? await Ride.find({ _id: { $in: joinedRideIds } })
          .populate("initiatorId", "name profilePicture")
          .lean()
      : [];

    const normalizeRide = (ride, role) => ({
      ...ride,
      role,
      initiatorName: ride.initiatorId?.name || "Host",
      initiatorProfilePicture: ride.initiatorId?.profilePicture || null,
    });

    const createdWithRole = createdRides.map((ride) =>
      normalizeRide(ride, "creator")
    );

    const joinedWithRole = joinedRides
      .filter((ride) => initiatorIdStr(ride) !== userIdStr)
      .map((ride) => normalizeRide(ride, "participant"));

    const participantWithRole = participantRides
      .filter((ride) => initiatorIdStr(ride) !== userIdStr)
      .map((ride) => normalizeRide(ride, "participant"));

    const rideMap = new Map();
    createdWithRole.forEach((ride) => rideMap.set(String(ride._id), ride));
    joinedWithRole.forEach((ride) => {
      const id = String(ride._id);
      if (!rideMap.has(id)) rideMap.set(id, ride);
    });
    participantWithRole.forEach((ride) => {
      const id = String(ride._id);
      if (!rideMap.has(id)) rideMap.set(id, ride);
    });

    const myRides = Array.from(rideMap.values()).sort(
      (a, b) =>
        new Date(b.departureTime || b.createdAt) -
        new Date(a.departureTime || a.createdAt)
    );

    const currentRides = myRides.filter((r) => profileRideBucket(r) === "active");
    const pastRides = myRides.filter((r) => profileRideBucket(r) === "past");

    return res.status(200).json({
      success: true,
      count: myRides.length,
      activeCount: currentRides.length,
      pastCount: pastRides.length,
      currentRides,
      pastRides,
      data: myRides,
    });
  } catch (error) {
    console.error("getMyRides() error:", error);

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
