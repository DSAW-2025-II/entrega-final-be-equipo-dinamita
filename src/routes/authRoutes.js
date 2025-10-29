import express from "express";
import { registerUser, uploadUserPhoto } from "../controllers/users/register.js";
import { validateUserRegistration } from "../controllers/users/validateRegister.js";
import { loginUser } from "../controllers/users/login.js";
import { validateLogin } from "../controllers/users/validateLogin.js";
import { logoutUser } from "../controllers/users/logout.js";
import { verifyToken } from "../controllers/users/verify.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import optionalAuthMiddleware from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// Register a new user
router.post("/users/register", validateUserRegistration, registerUser);

// Login user
router.post("/login", validateLogin, loginUser);

// Logout user (safe to call with or without a valid session)
router.post("/logout", optionalAuthMiddleware, logoutUser);

// Verify JWT token
router.get("/verify", authMiddleware, verifyToken);

// Upload user photo (protected route - users can only update their own photo)
router.patch("/users/:userId/photo", authMiddleware, uploadUserPhoto);

export default router;