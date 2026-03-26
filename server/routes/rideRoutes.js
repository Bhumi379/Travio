const express    = require("express");
const router     = express.Router();
const multer     = require("multer");
const protect    = require("../middleware/authmiddleware");
const upload     = require("../middleware/upload");
const Ride       = require("../models/Ride");

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

const rideDocsUpload = upload.fields([
  { name: "license", maxCount: 1 },
  { name: "aadhar", maxCount: 1 },
]);

const handleRideUpload = (req, res, next) => {
  rideDocsUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Max size is 5MB per file.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    }

    // Common when browser navigates/closes during upload.
    if (err.message === "Request aborted") {
      return res.status(499).json({
        success: false,
        message: "Upload was cancelled before completion.",
      });
    }

    // Cloudinary auth/config failures should be surfaced clearly.
    if (
      /cloudinary/i.test(err.message || "") ||
      /api key|api secret|signature|invalid/i.test(err.message || "")
    ) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed. Check Cloudinary credentials and file format.",
        error: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Unexpected upload error",
      error: err.message,
    });
  });
};

/* ================= STATIC ROUTES (must be before /:id) ================= */

// GET all rides (with geo + filter support)
router.get("/", getAllRides);

// GET my rides (created + joined)
router.get("/my-rides", protect, getMyRides);

// GET rides by a specific user
router.get("/user/:userId", getRidesByUser);

// CREATE ride
router.post("/create", protect, handleRideUpload, createRide);

/* ================= CLOUDINARY UPLOAD ================= */

router.post(
  "/upload-docs/:rideId",
  protect,
  handleRideUpload,
  async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId);

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      // ✅ Only the ride creator can upload docs
      if (ride.initiatorId.toString() !== (req.user.id || req.user._id).toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to upload docs for this ride",
        });
      }

      // ✅ Safe Mongoose subdoc update using ride.set()
      if (req.files?.license?.[0]) {
        ride.set("driver.driverLicenseImage", req.files.license[0].path);
      }

      if (req.files?.aadhar?.[0]) {
        ride.set("driver.aadharImage", req.files.aadhar[0].path);
      }

      await ride.save();

      res.status(200).json({
        success: true,
        message: "Documents uploaded successfully",
        driver: ride.driver,
      });

    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err.message,
      });
    }
  }
);

// Creator actions on a ride (must be before "/:id")
router.delete("/:id/cancel", protect, cancelRideByOwner);
router.delete("/:id/participants/:participantUserId", protect, removeParticipantFromRide);

/* ================= DYNAMIC ROUTES (must be last) ================= */

router.get("/:id",    getRideById);
router.put("/:id",    protect, updateRide);
router.delete("/:id", protect, deleteRide);

module.exports = router;