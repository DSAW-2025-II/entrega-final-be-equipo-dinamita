import { db } from "../../config/firebase.js";
import { compressImageToBase64 } from "../../utils/imageCompression.js";

export const updateUserPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    // Convertir archivo de multer a base64 (con compresión)
    let photoBase64 = null;

    if (req.files && req.files.photo && req.files.photo[0]) {
      const photoFile = req.files.photo[0];
      photoBase64 = await compressImageToBase64(
        photoFile.buffer,
        photoFile.mimetype,
        800, // maxWidth
        800, // maxHeight
        80   // quality
      );
    } else if (req.file) {
      // Fallback para compatibilidad
      photoBase64 = await compressImageToBase64(
        req.file.buffer,
        req.file.mimetype,
        800, // maxWidth
        800, // maxHeight
        80   // quality
      );
    } else {
      return res.status(400).json({ success: false, message: "No se proporcionó archivo de foto" });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Actualizar foto del usuario
    await db.collection("users").doc(userId).update({
      photo: photoBase64,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Foto de perfil actualizada exitosamente",
      photo: photoBase64
    });

  } catch (error) {
    console.error("Error actualizando foto de perfil:", error);
    return res.status(500).json({
      success: false,
      message: "Error actualizando foto de perfil",
      error: error.message,
    });
  }
};

