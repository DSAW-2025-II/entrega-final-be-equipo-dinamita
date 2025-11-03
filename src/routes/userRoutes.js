import express from "express";
import { 
  getUserById, 
  getAllUsers,
  getCurrentUser
} from "../controllers/users/userController.js";
import { updateCurrentRole } from "../controllers/users/updateCurrentRole.js";
import { updateUserPhoto } from "../controllers/users/updateUserPhoto.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadUserPhoto } from "../config/multer.js";

const router = express.Router();

// Protected route - get current user profile
router.get("/profile", authMiddleware, getCurrentUser);

// Update current role
router.patch("/current-role", authMiddleware, updateCurrentRole);

// Update user photo (protected route)
router.patch("/photo", authMiddleware, uploadUserPhoto, updateUserPhoto);

// Get user by ID
router.get("/:userId", getUserById);

// Get all users (for admin purposes)
router.get("/", getAllUsers);

export default router;
