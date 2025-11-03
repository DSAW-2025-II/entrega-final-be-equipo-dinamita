import express from "express";
import { registerVehicle } from "../controllers/vehicles/registerVehicle.js";
import { validateRegisterVehicle } from "../controllers/vehicles/validateRegisterVehicle.js";
import { getVehicle } from "../controllers/vehicles/getVehicle.js";
import { updateSOAT } from "../controllers/vehicles/updateSOAT.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadVehicleFiles, uploadSOAT } from "../config/multer.js";

const router = express.Router();

// Register a new vehicle (protected route)
router.post("/register", authMiddleware, uploadVehicleFiles, ...validateRegisterVehicle, registerVehicle);

// Get vehicle information (protected route)
router.get("/", authMiddleware, getVehicle);

// Update SOAT (protected route)
router.patch("/soat", authMiddleware, uploadSOAT, updateSOAT);

export default router;

