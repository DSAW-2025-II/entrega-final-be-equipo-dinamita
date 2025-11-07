import express from "express";
import multer from "multer";
import { registerVehicle } from "../controllers/vehicles/registerVehicle.js";
import { validateRegisterVehicle } from "../controllers/vehicles/validateRegisterVehicle.js";
import { updateSOAT } from "../controllers/vehicles/updateSOAT.js";
import { getVehicle } from "../controllers/vehicles/getVehicle.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Configuración de multer para almacenamiento en memoria (para subir a Firebase)
const storage = multer.memoryStorage();

// Configuración para vehículos (foto y SOAT)
const MAX_UPLOAD_SIZE_MB = 2;

const uploadVehicleFiles = multer({
  storage: storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    // Aceptar imágenes y PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y archivos PDF'), false);
    }
  }
});

// Configuración para SOAT solamente
const uploadSOAT = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Solo aceptar PDFs para SOAT
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('El SOAT debe ser un archivo PDF'), false);
    }
  }
});

const handleUploadErrors = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Los archivos deben pesar menos de 3MB. Comprime las imágenes e inténtalo nuevamente.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "Error al subir archivos",
      });
    }

    next();
  });
};

// Register a new vehicle (protected route)
router.post(
  "/register",
  authMiddleware,
  handleUploadErrors(
    uploadVehicleFiles.fields([
      { name: "photo", maxCount: 1 },
      { name: "soat", maxCount: 1 },
    ])
  ),
  validateRegisterVehicle,
  registerVehicle
);

// Get vehicle by ID (protected route)
router.get("/:vehicleId", authMiddleware, getVehicle);

// Update SOAT (protected route)
router.patch(
  "/soat/:vehicleId",
  authMiddleware,
  uploadSOAT.single("soat"),
  updateSOAT
);

export default router;

