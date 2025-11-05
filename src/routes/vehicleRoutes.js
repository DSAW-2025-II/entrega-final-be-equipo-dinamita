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
const uploadVehicleFiles = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Register a new vehicle (protected route)
router.post(
  "/",
  authMiddleware,
  uploadVehicleFiles.fields([
    { name: "photo", maxCount: 1 },
    { name: "soat", maxCount: 1 },
  ]),
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

