import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";

dotenv.config();
const app = express();

// Configurar CORS - permitir todos los origins por defecto
// En producción, configura ALLOWED_ORIGINS en las variables de entorno de Vercel
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, postman, server-to-server, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Obtener origins permitidos del environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : true; // Permitir todos si no se especifica
    
    if (allowedOrigins === true || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueado para origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Algunos navegadores antiguos requieren esto
};

// Configurar CORS antes de cualquier middleware
app.use(cors(corsOptions));

// Parse JSON bodies (pero no multipart/form-data, eso lo maneja multer)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicle", vehicleRoutes);

// Ruta de health check
app.get("/api/health", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Backend is running",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error en health check:", error);
    res.status(500).json({
      success: false,
      message: "Error en health check"
    });
  }
});

// Ruta catch-all para debugging (debe ir ANTES del middleware de errores)
// Solo se ejecuta si ninguna ruta anterior coincidió
app.use((req, res, next) => {
  // Si llegamos aquí, la ruta no fue encontrada
  console.log("Ruta no encontrada:", {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl
  });
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl
  });
});

// Middleware de manejo de errores global (debe ir al final)
app.use((err, req, res, next) => {
  console.error("Error en la aplicación:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;