import { db } from "../../config/firebase.js";

export const registerVehicle = async (req, res) => {
  try {
    const { brand, model, plate, capacity, color, photo, soat } = req.body;
    // Asume usuario autenticado por middleware JWT
    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ success: false, message: "No autenticado" });

    // Crear vehículo
    const vehicleData = {
      brand: brand.trim(),
      model: model.trim(),
      plate: plate.trim().toUpperCase(),
      capacity: parseInt(capacity),
      color: color ? color.trim() : null,
      photo: photo || null,
      soat: soat || null,
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
    return res.status(500).json({
      success: false,
      message: "Error registrando vehículo",
      error: error.message,
    });
  }
};