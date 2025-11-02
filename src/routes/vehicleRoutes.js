import express from "express";
import { registerVehicle } from "../controllers/vehicles/registerVehicle.js";
import { validateRegisterVehicle } from "../controllers/vehicles/validateRegisterVehicle.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadVehicleFiles } from "../config/multer.js";

const router = express.Router();

// Register a new vehicle (protected route)
router.post("/register", authMiddleware, uploadVehicleFiles, ...validateRegisterVehicle, registerVehicle);

export default router;

