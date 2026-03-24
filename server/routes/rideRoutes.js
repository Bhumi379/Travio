const express = require("express");
const router = express.Router();

const  protect  = require("../middleware/authmiddleware"); 
const {
  getAllRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  cancelRideByOwner,
  removeParticipantFromRide,
  getRidesByUser,
  getMyRides,
} = require("../controllers/rideController");

/* =====================================
   STATIC & SPECIFIC ROUTES FIRST
===================================== */

// // CREATE ride
// router.post("/create", createRide);
// Apply protect middleware
router.post("/create", protect, createRide);
// GET all rides (geo + filters + search)
router.get("/", getAllRides);
// GET current user's rides (created + joined)
router.get("/my-rides", protect, getMyRides);

// GET rides by a specific user
router.get("/user/:userId", getRidesByUser);

/* =====================================
   DYNAMIC ROUTES LAST (VERY IMPORTANT)
===================================== */

// GET one ride by ID
router.get("/:id", getRideById);

// Creator actions on a ride
router.delete("/:id/cancel", protect, cancelRideByOwner);
router.delete("/:id/participants/:participantUserId", protect, removeParticipantFromRide);

// UPDATE ride
router.put("/:id", protect, updateRide);

// DELETE ride
router.delete("/:id", protect, deleteRide);

module.exports = router;
