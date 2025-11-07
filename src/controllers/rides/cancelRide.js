import { db } from "../../config/firebase.js";

export const cancelRide = async (req, res) => {
    try {
        const { userId } = req.user;
        const { rideId } = req.params;

        if (!rideId) {
            return res.status(400).json({
                success: false,
                message: "ID de viaje requerido"
            });
        }

        // Obtener el viaje
        const rideRef = db.collection("rides").doc(rideId);
        const rideDoc = await rideRef.get();

        if (!rideDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Viaje no encontrado"
            });
        }

        const rideData = rideDoc.data();

        // Verificar que el usuario es el conductor del viaje
        if (rideData.driverId !== userId) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para cancelar este viaje"
            });
        }

        // Verificar que el viaje no esté ya cancelado
        if (rideData.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Este viaje ya está cancelado"
            });
        }

        // Actualizar el estado del viaje a "cancelled"
        await rideRef.update({
            status: "cancelled",
            updatedAt: new Date()
        });

        // Remover el ID del viaje del array 'rides' del usuario
        const userDoc = await db.collection("users").doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userRides = userData.rides || [];
            
            // Filtrar el rideId del array
            const updatedRides = userRides.filter(id => id !== rideId);
            
            await db.collection("users").doc(userId).update({
                rides: updatedRides,
                updatedAt: new Date()
            });
        }

        // Retornar éxito
        res.status(200).json({
            success: true,
            message: "Viaje cancelado exitosamente"
        });

    } catch (error) {
        console.error("Error cancelando viaje:", error);
        return res.status(500).json({
            success: false,
            message: "Error cancelando viaje",
            error: error.message
        });
    }
};

