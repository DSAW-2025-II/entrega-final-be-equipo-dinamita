import { db } from "../../config/firebase.js";

export const updateSOAT = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    // Convertir archivo de multer a base64
    let soatBase64 = null;

    if (req.file) {
      soatBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else {
      return res.status(400).json({ success: false, message: "No se proporcionó archivo de SOAT" });
    }

    // Obtener vehículo del usuario
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();
    const vehicleId = userData.vehicleId;

    if (!vehicleId) {
      return res.status(404).json({ success: false, message: "Usuario no tiene vehículo registrado" });
    }

    // Actualizar SOAT del vehículo
    await db.collection("vehicles").doc(vehicleId).update({
      soat: soatBase64,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "SOAT actualizado exitosamente"
    });

  } catch (error) {
    console.error("❌ Error actualizando SOAT:", error);
    return res.status(500).json({
      success: false,
      message: "Error actualizando SOAT",
      error: error.message,
    });
  }
};


