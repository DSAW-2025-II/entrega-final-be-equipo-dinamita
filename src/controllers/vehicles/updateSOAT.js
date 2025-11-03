import { db } from "../../config/firebase.js";
import { compressImageToBase64 } from "../../utils/imageCompression.js";

export const updateSOAT = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    // Convertir archivo de multer a base64 (con compresión)
    let soatBase64 = null;

    if (req.file) {
      soatBase64 = await compressImageToBase64(
        req.file.buffer,
        req.file.mimetype,
        800, // maxWidth
        800, // maxHeight
        80   // quality
      );
    } else {
      return res.status(400).json({ success: false, message: "No se proporcionó archivo de SOAT" });
    }

    // Obtener vehículo del usuario
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();
    let vehicleId = userData.vehicleId;

    if (!vehicleId || (typeof vehicleId === 'string' && vehicleId.trim() === '')) {
      const vehicleQuery = await db.collection("vehicles")
        .where("ownerId", "==", userId)
        .limit(1)
        .get();
      
      if (vehicleQuery.empty) {
        return res.status(404).json({ success: false, message: "Usuario no tiene vehículo registrado" });
      }
      
      vehicleId = vehicleQuery.docs[0].id;
      
      await db.collection("users").doc(userId).update({
        vehicleId: vehicleId,
        updatedAt: new Date()
      });
    } else {
      vehicleId = typeof vehicleId === 'string' ? vehicleId.trim() : vehicleId;
    }

    const vehicleDoc = await db.collection("vehicles").doc(vehicleId).get();
    
    if (!vehicleDoc.exists) {
      const vehicleQuery = await db.collection("vehicles")
        .where("ownerId", "==", userId)
        .limit(1)
        .get();
      
      if (vehicleQuery.empty) {
        return res.status(404).json({ success: false, message: "Vehículo no encontrado en la base de datos" });
      }
      
      vehicleId = vehicleQuery.docs[0].id;
      
      await db.collection("users").doc(userId).update({
        vehicleId: vehicleId,
        updatedAt: new Date()
      });
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
    console.error("Error actualizando SOAT:", error);
    return res.status(500).json({
      success: false,
      message: "Error actualizando SOAT",
      error: error.message,
    });
  }
};


