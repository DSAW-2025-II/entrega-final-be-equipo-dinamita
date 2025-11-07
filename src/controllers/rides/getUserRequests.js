import { db } from "../../config/firebase.js";

export const getUserRequests = async (req, res) => {
    try {
        const { userId } = req.user;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        // Obtener el usuario
        const userDoc = await db.collection("users").doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const userData = userDoc.data();
        const userRequests = userData.requests || [];

        if (userRequests.length === 0) {
            return res.status(200).json({
                success: true,
                requests: []
            });
        }

        // Obtener todos los viajes solicitados
        const requests = await Promise.all(
            userRequests.map(async (rideId) => {
                try {
                    const rideDoc = await db.collection("rides").doc(rideId).get();
                    
                    if (!rideDoc.exists) {
                        return null;
                    }

                    const rideData = rideDoc.data();

                    // Filtrar viajes cancelados - no mostrar viajes cancelados en las reservas
                    if (rideData.status === "cancelled") {
                        return null;
                    }

                    // Obtener información del vehículo
                    let vehicleImage = null;
                    if (rideData.vehicleId) {
                        try {
                            const vehicleDoc = await db.collection("vehicles")
                                .doc(rideData.vehicleId)
                                .get();
                            
                            if (vehicleDoc.exists) {
                                const vehicleData = vehicleDoc.data();
                                vehicleImage = vehicleData.photo || vehicleData.image || null;
                            }
                        } catch (error) {
                            console.error(`Error obteniendo vehículo ${rideData.vehicleId}:`, error);
                        }
                    }

                    // Encontrar los pasajeros de este usuario en el viaje
                    const userPassengers = (rideData.passengers || []).filter(
                        p => p.userId === userId
                    );

                    return {
                        id: rideId,
                        ...rideData,
                        departureTime: rideData.departureTime?.toDate?.() 
                            ? rideData.departureTime.toDate().toISOString() 
                            : rideData.departureTime,
                        createdAt: rideData.createdAt?.toDate?.() 
                            ? rideData.createdAt.toDate().toISOString() 
                            : rideData.createdAt,
                        updatedAt: rideData.updatedAt?.toDate?.() 
                            ? rideData.updatedAt.toDate().toISOString() 
                            : rideData.updatedAt,
                        image: vehicleImage,
                        userPassengers: userPassengers, // Solo los pasajeros de este usuario
                        totalTickets: userPassengers.length // Total de pasajes del usuario
                    };
                } catch (error) {
                    console.error(`Error obteniendo viaje ${rideId}:`, error);
                    return null;
                }
            })
        );

        // Filtrar los nulls (viajes que no existen)
        const validRequests = requests.filter(req => req !== null);

        // Ordenar por fecha de salida (más cercano primero)
        validRequests.sort((a, b) => {
            const aDate = new Date(a.departureTime);
            const bDate = new Date(b.departureTime);
            return aDate - bDate;
        });

        res.status(200).json({
            success: true,
            requests: validRequests
        });

    } catch (error) {
        console.error("Error obteniendo reservas del usuario:", error);
        return res.status(500).json({
            success: false,
            message: "Error obteniendo reservas",
            error: error.message
        });
    }
};

