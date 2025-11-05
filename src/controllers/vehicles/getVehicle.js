import { db } from "../../config/firebase.js";

export const getVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { userId } = req.user;

        if (!vehicleId) {
            return res.status(400).json({
                success: false,
                message: "ID de vehículo requerido"
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        const vehicleDoc = await db.collection("vehicles").doc(vehicleId).get();

        if (!vehicleDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Vehículo no encontrado"
            });
        }

        const vehicleData = vehicleDoc.data();

        // Validar que el usuario sea el dueño del vehículo
        if (vehicleData.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para ver este vehículo"
            });
        }

        res.status(200).json({
            success: true,
            vehicle: {
                id: vehicleDoc.id,
                ...vehicleData
            }
        });

    } catch (error) {
        console.error("Error obteniendo vehículo:", error);
        return res.status(500).json({
            success: false,
            message: "Error obteniendo vehículo",
            error: error.message
        });
    }
};

