import express from "express";
import { 
  getUserById, 
  getAllUsers
} from "../controllers/userController.js";

const router = express.Router();

// Get user by ID
router.get("/:userId", getUserById);

// Get all users (for admin purposes)
router.get("/", getAllUsers);

export default router;
