import { db } from "../../config/firebase.js";

export const requestRide = async (req, res) => {
    try {
        const { userId } = req.user;
        const { rideId } = req.params;
        const { tickets, passengerPoints } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        // Validar que se proporcionen tickets y puntos
        if (!tickets || tickets < 1) {
            return res.status(400).json({
                success: false,
                message: "Debes solicitar al menos 1 pasaje"
            });
        }

        if (!passengerPoints || !Array.isArray(passengerPoints) || passengerPoints.length !== tickets) {
            return res.status(400).json({
                success: false,
                message: "Debes proporcionar puntos para todos los pasajes"
            });
        }

        // Validar que todos los puntos estén completos
        const incompletePoints = passengerPoints.some(point => !point || !point.trim());
        if (incompletePoints) {
            return res.status(400).json({
                success: false,
                message: "Todos los puntos deben estar completos"
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
        if (rideData.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "El viaje no está disponible"
            });
        }

        // Validar que el usuario no sea el conductor
        if (rideData.driverId === userId) {
            return res.status(400).json({
                success: false,
                message: "No puedes solicitar tu propio viaje"
            });
        }

        // Validar que haya suficientes asientos disponibles
        const availableSeats = rideData.availableSeats || 0;
        if (tickets > availableSeats) {
            return res.status(400).json({
                success: false,
                message: `No hay suficientes asientos disponibles. Solo quedan ${availableSeats} asiento(s)`
            });
        }

        // Obtener información del usuario que solicita
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const userData = userDoc.data();
        const passengerName = `${userData.name} ${userData.lastName}`;
        const passengerContact = userData.contactNumber || null;

        // Verificar si el usuario ya tiene una solicitud en este viaje
        const existingPassengers = rideData.passengers || [];
        const alreadyRequested = existingPassengers.some(p => p.userId === userId);
        
        if (alreadyRequested) {
            return res.status(400).json({
                success: false,
                message: "Ya tienes una solicitud en este viaje"
            });
        }

        // Crear objetos de pasajeros (uno por cada pasaje)
        const newPassengers = passengerPoints.map((point, index) => ({
            userId: userId,
            name: passengerName,
            contact: passengerContact,
            point: point.trim(),
            tickets: 1, // Cada objeto representa 1 pasaje
            requestedAt: new Date()
        }));

        // Actualizar el viaje: agregar pasajeros y reducir asientos disponibles
        const updatedPassengers = [...existingPassengers, ...newPassengers];
        const newAvailableSeats = Math.max(0, availableSeats - tickets); // Asegurar que no sea negativo

        // Actualizar usando transacción para evitar condiciones de carrera
        try {
            await db.runTransaction(async (transaction) => {
                const rideDoc = await transaction.get(rideRef);
                
                if (!rideDoc.exists) {
                    throw new Error("Viaje no encontrado");
                }
                
                const currentRideData = rideDoc.data();
                const currentAvailableSeats = currentRideData.availableSeats || 0;
                
                // Verificar nuevamente que haya suficientes asientos (por si otro request los tomó)
                if (tickets > currentAvailableSeats) {
                    throw new Error(`No hay suficientes asientos disponibles. Solo quedan ${currentAvailableSeats} asiento(s)`);
                }
                
                const finalAvailableSeats = Math.max(0, currentAvailableSeats - tickets);
                
                transaction.update(rideRef, {
                    passengers: [...(currentRideData.passengers || []), ...newPassengers],
                    availableSeats: finalAvailableSeats,
                    updatedAt: new Date()
                });
                
                return finalAvailableSeats;
            });
        } catch (transactionError) {
            // Si es un error de validación, retornar el mensaje
            if (transactionError.message.includes("No hay suficientes asientos")) {
                return res.status(400).json({
                    success: false,
                    message: transactionError.message
                });
            }
            throw transactionError;
        }
        
        // Obtener el valor actualizado para la respuesta
        const updatedRideDoc = await rideRef.get();
        const updatedRideData = updatedRideDoc.data();
        const finalAvailableSeats = updatedRideData.availableSeats || 0;

        // Agregar el ID del viaje al array 'requests' del usuario
        const userRequests = userData.requests || [];
        if (!userRequests.includes(rideId)) {
            userRequests.push(rideId);
            await db.collection("users").doc(userId).update({
                requests: userRequests,
                updatedAt: new Date()
            });
        }

        // Retornar éxito
        res.status(200).json({
            success: true,
            message: "Solicitud de viaje realizada exitosamente",
            ride: {
                id: rideId,
                availableSeats: finalAvailableSeats,
                passengers: updatedRideData.passengers || []
            }
        });

    } catch (error) {
        console.error("Error solicitando viaje:", error);
        return res.status(500).json({
            success: false,
            message: "Error procesando la solicitud de viaje",
            error: error.message
        });
    }
};

