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

app.use(cors(corsOptions));

// Manejar preflight requests explícitamente para todas las rutas
// Express 5 no acepta '*' directamente, así que usamos un middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    
    // Determinar el origin permitido
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : true;
    
    let allowOrigin = '*';
    if (allowedOrigins !== true && origin) {
      if (allowedOrigins.includes(origin)) {
        allowOrigin = origin;
      }
    } else if (origin) {
      allowOrigin = origin;
    }
    
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 horas
    return res.status(200).end();
  }
  next();
});

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
  res.status(200).json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString()
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