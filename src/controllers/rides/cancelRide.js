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

        // Remover el ID del viaje del array 'rides' del conductor
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

        // Remover el rideId del array 'requests' de todos los pasajeros que tienen este viaje
        const passengers = rideData.passengers || [];
        if (passengers.length > 0) {
            // Obtener todos los userIds únicos de los pasajeros
            const uniquePassengerIds = [...new Set(passengers.map(p => p.userId).filter(Boolean))];
            
            // Actualizar cada pasajero para remover el rideId de su array 'requests'
            await Promise.all(
                uniquePassengerIds.map(async (passengerId) => {
                    try {
                        const passengerDoc = await db.collection("users").doc(passengerId).get();
                        
                        if (passengerDoc.exists) {
                            const passengerData = passengerDoc.data();
                            const passengerRequests = passengerData.requests || [];
                            
                            // Filtrar el rideId del array
                            const updatedRequests = passengerRequests.filter(id => id !== rideId);
                            
                            await db.collection("users").doc(passengerId).update({
                                requests: updatedRequests,
                                updatedAt: new Date()
                            });
                        }
                    } catch (error) {
                        console.error(`Error actualizando pasajero ${passengerId} al cancelar viaje:`, error);
                        // Continuar con los demás pasajeros aunque falle uno
                    }
                })
            );
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

