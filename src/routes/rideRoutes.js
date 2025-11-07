import express from "express";
import { createRide } from "../controllers/rides/createRide.js";
import { getDriverRides } from "../controllers/rides/getDriverRides.js";
import { getAllRides } from "../controllers/rides/getAllRides.js";
import { cancelRide } from "../controllers/rides/cancelRide.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import optionalAuthMiddleware from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// Create a new ride (protected route - only drivers)
router.post("/", authMiddleware, createRide);

// Get driver's rides (protected route - only drivers)
router.get("/driver", authMiddleware, getDriverRides);

// Get all available rides (public route, but can use optional auth for future filtering)
router.get("/", optionalAuthMiddleware, getAllRides);

// Cancel a ride (protected route - only the driver owner)
router.delete("/:rideId", authMiddleware, cancelRide);

export default router;
