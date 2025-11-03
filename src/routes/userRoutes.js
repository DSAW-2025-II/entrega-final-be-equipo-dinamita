import express from "express";
import { 
  getUserById, 
  getAllUsers,
  getCurrentUser
} from "../controllers/users/userController.js";
import { updateCurrentRole } from "../controllers/users/updateCurrentRole.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected route - get current user profile
router.get("/profile", authMiddleware, getCurrentUser);

// Update current role
router.patch("/current-role", authMiddleware, updateCurrentRole);

// Get user by ID
router.get("/:userId", getUserById);

// Get all users (for admin purposes)
router.get("/", getAllUsers);

export default router;
