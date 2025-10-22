import express from "express";
import { registerUser } from "../controllers/users/register.js";
import { validateUserRegistration } from "../controllers/users/validateRegister.js";
import { loginUser } from "../controllers/users/login.js";
import { validateLogin } from "../controllers/users/validateLogin.js";

const router = express.Router();

// Register a new user
router.post("/users/register", validateUserRegistration, registerUser);

// Login user
router.post("/login", validateLogin, loginUser);

export default router;
