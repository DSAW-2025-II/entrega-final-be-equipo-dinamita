import { db } from "../../config/firebase.js";

export const cancelRideRequest = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id: rideId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

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

        // Validar que el viaje esté activo
        if (rideData.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "El viaje ya está cancelado"
            });
        }

        // Obtener los pasajeros del usuario en este viaje
        const passengers = rideData.passengers || [];
        const userPassengers = passengers.filter(p => p.userId === userId);

        // Validar que el usuario tenga una reservación en este viaje
        if (userPassengers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No tienes una reservación en este viaje"
            });
        }

        // Contar cuántos tickets tiene el usuario (cada objeto representa 1 ticket)
        const ticketsToReturn = userPassengers.length;

        // Remover los pasajeros del usuario del array
        const updatedPassengers = passengers.filter(p => p.userId !== userId);

        // Calcular nuevos asientos disponibles
        const currentAvailableSeats = rideData.availableSeats || 0;
        const newAvailableSeats = currentAvailableSeats + ticketsToReturn;

        // Obtener el usuario para actualizar su array de requests
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const userData = userDoc.data();
        const userRequests = userData.requests || [];

        // Remover el rideId del array de requests del usuario
        const updatedUserRequests = userRequests.filter(id => id !== rideId);

        // Usar transacción para asegurar consistencia
        try {
            await db.runTransaction(async (transaction) => {
                // Verificar nuevamente el viaje
                const currentRideDoc = await transaction.get(rideRef);
                
                if (!currentRideDoc.exists) {
                    throw new Error("Viaje no encontrado");
                }

                const currentRideData = currentRideDoc.data();

                // Verificar que el usuario aún tenga pasajeros en el viaje
                const currentPassengers = currentRideData.passengers || [];
                const currentUserPassengers = currentPassengers.filter(p => p.userId === userId);

                if (currentUserPassengers.length === 0) {
                    throw new Error("No tienes una reservación en este viaje");
                }

                // Calcular los tickets a devolver basándose en los pasajeros actuales
                const ticketsToReturnInTransaction = currentUserPassengers.length;
                const updatedPassengersInTransaction = currentPassengers.filter(p => p.userId !== userId);
                const currentAvailableSeatsInTransaction = currentRideData.availableSeats || 0;
                const newAvailableSeatsInTransaction = currentAvailableSeatsInTransaction + ticketsToReturnInTransaction;

                // Actualizar el viaje
                transaction.update(rideRef, {
                    passengers: updatedPassengersInTransaction,
                    availableSeats: newAvailableSeatsInTransaction,
                    updatedAt: new Date()
                });

                // Actualizar el usuario
                transaction.update(userRef, {
                    requests: updatedUserRequests,
                    updatedAt: new Date()
                });
            });
        } catch (transactionError) {
            // Si es un error de validación, retornar el mensaje
            if (transactionError.message.includes("No tienes una reservación") || 
                transactionError.message.includes("Viaje no encontrado")) {
                return res.status(400).json({
                    success: false,
                    message: transactionError.message
                });
            }
            throw transactionError;
        }

        // Retornar éxito
        res.status(200).json({
            success: true,
            message: "Reservación cancelada exitosamente",
            ride: {
                id: rideId,
                availableSeats: newAvailableSeats
            }
        });

    } catch (error) {
        console.error("Error cancelando reservación:", error);
        return res.status(500).json({
            success: false,
            message: "Error procesando la cancelación de la reservación",
            error: error.message
        });
    }
};

