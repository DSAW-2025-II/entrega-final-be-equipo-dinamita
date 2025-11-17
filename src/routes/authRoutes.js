import express from "express";
import multer from "multer";
import { registerUser, uploadUserPhoto } from "../controllers/users/register.js";
import { validateUserRegistration } from "../controllers/users/validateRegister.js";
import { loginUser } from "../controllers/users/login.js";
import { validateLogin } from "../controllers/users/validateLogin.js";
import { logoutUser } from "../controllers/users/logout.js";
import { verifyToken } from "../controllers/users/verify.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import optionalAuthMiddleware from "../middlewares/optionalAuthMiddleware.js";
import { uploadUserPhoto as multerUploadUserPhoto } from "../config/multer.js";

const router = express.Router();

// Middleware para manejar errores de multer (error handler con 4 parámetros)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        errors: { photo: "El archivo es demasiado grande. Máximo 10MB" }
      });
    }
    return res.status(400).json({
      success: false,
      errors: { photo: "Error al procesar el archivo" }
    });
  }
  if (err) {
    if (err.message && err.message.includes("Solo se permiten archivos de imagen")) {
      return res.status(400).json({
        success: false,
        errors: { photo: "Solo se permiten archivos de imagen (jpeg, jpg, png, webp)" }
      });
    }
    return res.status(400).json({
      success: false,
      errors: { photo: err.message || "Error al procesar el archivo" }
    });
  }
  next(err);
};

// Wrapper para multer que maneja errores
const multerWithErrorHandling = (req, res, next) => {
  multerUploadUserPhoto(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Register a new user (con multer para foto opcional)
router.post("/users/register", multerWithErrorHandling, ...validateUserRegistration, registerUser);

// Login user
router.post("/login", validateLogin, loginUser);

// Logout user (safe to call with or without a valid session)
router.post("/logout", optionalAuthMiddleware, logoutUser);

// Verify JWT token
router.get("/verify", authMiddleware, verifyToken);

// Upload user photo (protected route - users can only update their own photo)
router.patch("/users/:userId/photo", authMiddleware, uploadUserPhoto);

export default router;