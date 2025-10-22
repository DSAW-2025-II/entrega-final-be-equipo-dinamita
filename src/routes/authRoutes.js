import express from "express";
import { 
  registerUser, 
  validateUserRegistration 
} from "../controllers/userController.js";

const router = express.Router();

// Register a new user
router.post("/users/register", validateUserRegistration, registerUser);

export default router;
