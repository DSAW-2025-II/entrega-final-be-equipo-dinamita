import { db } from "../../config/firebase.js";

export const getDriverRides = async (req, res) => {
    try {
        const { userId } = req.user;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        // Obtener todos los viajes del conductor
        // Nota: Si hay un error con orderBy, puede requerir crear un índice en Firestore
        let ridesSnapshot;
        try {
            ridesSnapshot = await db.collection("rides")
                .where("driverId", "==", userId)
                .orderBy("createdAt", "desc")
                .get();
        } catch (error) {
            // Si falla el orderBy, obtener sin ordenar y ordenar en JavaScript
            console.warn("Error con orderBy, ordenando en JavaScript:", error.message);
            ridesSnapshot = await db.collection("rides")
                .where("driverId", "==", userId)
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
            createdAt: doc.data().createdAt
        }));

        // Ordenar por fecha de creación (más reciente primero) si no se ordenó en Firestore
        if (!ridesSnapshot.query || !ridesSnapshot.query._queryOptions?.orderBy) {
            ridesArray.sort((a, b) => {
                const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return bDate - aDate; // Orden descendente
            });
        }

        // Obtener información del vehículo para cada viaje
        const rides = await Promise.all(
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

        res.status(200).json({
            success: true,
            rides
        });

    } catch (error) {
        console.error("Error obteniendo viajes del conductor:", error);
        return res.status(500).json({
            success: false,
            message: "Error obteniendo viajes",
            error: error.message
        });
    }
};
