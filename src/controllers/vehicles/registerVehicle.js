import { db } from "../../config/firebase.js";
import { compressImageToBase64 } from "../../utils/imageCompression.js";

export const registerVehicle = async (req, res) => {
  try {
    const { brand, model, plate, capacity, color } = req.body;
    // Asume usuario autenticado por middleware JWT
    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ success: false, message: "No autenticado" });
    
    // Validar que todos los campos requeridos estén presentes
    if (!brand || !model || !plate || !capacity) {
      return res.status(400).json({
        success: false,
        errors: {
          general: "Todos los campos son requeridos",
          missing: {
            brand: !brand,
            model: !model,
            plate: !plate,
            capacity: !capacity
          }
        }
      });
    }

    // Convertir archivos de multer a base64 (con compresión)
    let photoBase64 = null;
    let soatBase64 = null;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        const photoFile = req.files.photo[0];
        photoBase64 = await compressImageToBase64(
          photoFile.buffer,
          photoFile.mimetype,
          800, // maxWidth
          800, // maxHeight
          80   // quality
        );
      }
      if (req.files.soat && req.files.soat[0]) {
        const soatFile = req.files.soat[0];
        soatBase64 = await compressImageToBase64(
          soatFile.buffer,
          soatFile.mimetype,
          800, // maxWidth
          800, // maxHeight
          80   // quality
        );
      }
    }

    // Crear vehículo
    const vehicleData = {
      brand: brand.trim(),
      model: model.trim(),
      plate: plate.trim().toUpperCase(),
      capacity: parseInt(capacity),
      color: color ? color.trim() : null,
      photo: photoBase64,
      soat: soatBase64,
      ownerId: userId,
      createdAt: new Date(),
    };

    const vehicleRef = await db.collection("vehicles").add(vehicleData);

    // Actualizar usuario a driver y agregar vehicleId
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    const user = userDoc.data();
    let roles = user.roles || [];
    if (!roles.includes("driver")) roles.push("driver");
    await userRef.update({
      roles,
      currentRole: "driver",
      vehicleId: vehicleRef.id, // Agregar ID del vehículo al usuario
      rides: [],
      updatedAt: new Date()
    });

    // Obtener usuario actualizado para la respuesta
    const updatedUserDoc = await userRef.get();
    const updatedUser = updatedUserDoc.data();

    return res.status(201).json({
      message: "Vehicle registered successfully and driver role activated.",
      vehicle: {
        id: vehicleRef.id,
        brand: vehicleData.brand,
        plate: vehicleData.plate
      },
      user: {
        id: userId,
        roles: updatedUser.roles
      }
    });
  } catch (error) {
    console.error("❌ Error registrando vehículo:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error registrando vehículo",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};