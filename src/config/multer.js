import multer from "multer";
import path from "path";

// Configuración de almacenamiento en memoria (para luego subir a Firebase Storage o guardar)
const storage = multer.memoryStorage();

// Filtro para solo aceptar imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen (jpeg, jpg, png, webp, svg)"));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
  },
  fileFilter: fileFilter,
});

// Middleware específico para registro de vehículo (2 archivos: photo y soat)
export const uploadVehicleFiles = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "soat", maxCount: 1 },
]);

// Middleware específico para registro de usuario (1 archivo: photo, pero también procesa otros campos)
// Usamos .fields para asegurar que parse todos los campos de FormData
export const uploadUserPhoto = upload.fields([
  { name: "photo", maxCount: 1 }
]);

// Middleware específico para actualizar SOAT (1 archivo: soat)
export const uploadSOAT = upload.single("soat");

export default upload;

