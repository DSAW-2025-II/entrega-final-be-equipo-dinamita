import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
// Parse JSON bodies (pero no multipart/form-data, eso lo maneja multer)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicle", vehicleRoutes);

export default app;