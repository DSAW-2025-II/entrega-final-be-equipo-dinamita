import { db } from "../../config/firebase.js";

export const getAllRides = async (req, res) => {
    try {
        // Obtener todos los viajes activos
        // Nota: Si hay un error con orderBy, puede requerir crear un índice en Firestore
        let ridesSnapshot;
        try {
            ridesSnapshot = await db.collection("rides")
                .where("status", "==", "active")
                .orderBy("departureTime", "asc")
                .get();
        } catch (error) {
            // Si falla el orderBy, obtener sin ordenar y ordenar en JavaScript
            console.warn("Error con orderBy, ordenando en JavaScript:", error.message);
            ridesSnapshot = await db.collection("rides")
                .where("status", "==", "active")
                .get();
        }

        if (ridesSnapshot.empty) {
            return res.status(200).json({
                success: true,
                rides: []
            });
        }

        // Convertir a array y ordenar si no se ordenó en Firestore
        let ridesArray = ridesSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            departureTime: doc.data().departureTime
        }));

        // Filtrar solo los viajes con fecha futura y ordenar por fecha de salida
        const now = new Date();
        ridesArray = ridesArray.filter(item => {
            const departureDate = item.departureTime?.toDate 
                ? item.departureTime.toDate() 
                : new Date(item.departureTime);
            return departureDate > now;
        });

        // Ordenar por fecha de salida (más cercano primero) si no se ordenó en Firestore
        if (!ridesSnapshot.query || !ridesSnapshot.query._queryOptions?.orderBy) {
            ridesArray.sort((a, b) => {
                const aDate = a.departureTime?.toDate ? a.departureTime.toDate() : new Date(a.departureTime);
                const bDate = b.departureTime?.toDate ? b.departureTime.toDate() : new Date(b.departureTime);
                return aDate - bDate; // Orden ascendente (más cercano primero)
            });
        }

        // Obtener información del vehículo para cada viaje
        let rides = await Promise.all(
            ridesArray.map(async (item) => {
                const rideData = item.data;
                const rideId = item.id;

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
                    image: vehicleImage // Imagen del vehículo
                };
            })
        );

        // Si hay un usuario autenticado, filtrar los viajes que él creó
        if (req.user && req.user.userId) {
            rides = rides.filter(ride => ride.driverId !== req.user.userId);
        }

        res.status(200).json({
            success: true,
            rides
        });

    } catch (error) {
        console.error("Error obteniendo viajes:", error);
        return res.status(500).json({
            success: false,
            message: "Error obteniendo viajes",
            error: error.message
        });
    }
};
