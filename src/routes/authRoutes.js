import express from "express";
import { 
  registerUser, 
  loginUser,
  validateUserRegistration,
  validateLogin
} from "../controllers/userController.js";

const router = express.Router();

// Register a new user
router.post("/users/register", validateUserRegistration, registerUser);

// Login user
router.post("/login", validateLogin, loginUser);

export default router;
