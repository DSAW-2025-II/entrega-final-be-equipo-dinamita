import { db } from "../../config/firebase.js";

export const finalizeRide = async (req, res) => {
    try {
        const { userId } = req.user;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        // Buscar un viaje activo del conductor
        const ridesSnapshot = await db.collection("rides")
            .where("driverId", "==", userId)
            .where("status", "==", "active")
            .get();

        if (ridesSnapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No tienes ningún viaje activo para finalizar"
            });
        }

        // Si hay múltiples viajes activos, tomar el primero (o podrías implementar lógica para elegir uno específico)
        const activeRideDoc = ridesSnapshot.docs[0];
        const activeRideRef = db.collection("rides").doc(activeRideDoc.id);
        const activeRideData = activeRideDoc.data();

        // Actualizar el estado del viaje a "finished"
        await activeRideRef.update({
            status: "finished",
            finishedAt: new Date(),
            updatedAt: new Date()
        });

        // Retornar éxito
        res.status(200).json({
            success: true,
            message: "Viaje finalizado exitosamente",
            ride: {
                id: activeRideDoc.id,
                status: "finished"
            }
        });

    } catch (error) {
        console.error("Error finalizando viaje:", error);
        return res.status(500).json({
            success: false,
            message: "Error finalizando viaje",
            error: error.message
        });
    }
};

