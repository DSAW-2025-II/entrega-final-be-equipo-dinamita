import { db } from "../../config/firebase.js";

export const getVehicle = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

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
      
      const foundVehicleDoc = vehicleQuery.docs[0];
      const foundVehicleId = foundVehicleDoc.id;
      
      await db.collection("users").doc(userId).update({
        vehicleId: foundVehicleId,
        updatedAt: new Date()
      });
      
      const vehicleData = foundVehicleDoc.data();
      
      return res.status(200).json({
        success: true,
        vehicle: {
          id: foundVehicleId,
          brand: vehicleData.brand,
          model: vehicleData.model,
          plate: vehicleData.plate,
          capacity: vehicleData.capacity,
          color: vehicleData.color || "No especificado",
          photo: vehicleData.photo,
          soat: vehicleData.soat,
          createdAt: vehicleData.createdAt
        }
      });
    }

    const vehicleData = vehicleDoc.data();

    res.status(200).json({
      success: true,
      vehicle: {
        id: vehicleDoc.id,
        brand: vehicleData.brand,
        model: vehicleData.model,
        plate: vehicleData.plate,
        capacity: vehicleData.capacity,
        color: vehicleData.color || "No especificado",
        photo: vehicleData.photo,
        soat: vehicleData.soat,
        createdAt: vehicleData.createdAt
      }
    });

  } catch (error) {
    console.error("Error obteniendo vehículo:", error);
    return res.status(500).json({
      success: false,
      message: "Error obteniendo vehículo",
      error: error.message,
    });
  }
};

