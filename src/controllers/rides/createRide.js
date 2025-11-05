import { db } from "../../config/firebase.js";

export const createRide = async (req, res) => {
    try {
        const { userId } = req.user;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        // Obtener el usuario para verificar que sea conductor
        const userDoc = await db.collection("users").doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const userData = userDoc.data();

        // Validar que el usuario sea conductor
        if (!userData.roles || !userData.roles.includes('driver')) {
            return res.status(403).json({
                success: false,
                message: "Solo los conductores pueden crear viajes"
            });
        }

        // Validar que el usuario tenga un vehículo registrado
        if (!userData.vehicleId) {
            return res.status(400).json({
                success: false,
                message: "Debes registrar un vehículo antes de crear un viaje"
            });
        }

        const { departurePoint, destinationPoint, route, departureTime, capacity, pricePassenger } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!departurePoint || !destinationPoint || !route || !departureTime || !capacity || !pricePassenger) {
            return res.status(400).json({
                success: false,
                errors: {
                    general: "Todos los campos son requeridos",
                    missing: {
                        departurePoint: !departurePoint,
                        destinationPoint: !destinationPoint,
                        route: !route,
                        departureTime: !departureTime,
                        capacity: !capacity,
                        pricePassenger: !pricePassenger
                    }
                }
            });
        }

        // Validar que capacity sea un número entero positivo
        const capacityNum = parseInt(capacity);
        if (isNaN(capacityNum) || capacityNum <= 0 || parseFloat(capacity) !== capacityNum) {
            return res.status(400).json({
                success: false,
                errors: {
                    capacity: "La capacidad debe ser un número entero positivo"
                }
            });
        }

        // Obtener información del vehículo del conductor para validar capacidad
        // Limpiar el vehicleId por si tiene espacios o caracteres extra
        const cleanVehicleId = String(userData.vehicleId || "").trim();
        
        let vehicleDoc = null;
        let vehicleData = null;
        let vehicleIdForRide = null;
        
        // Intentar primero con el ID directo
        if (cleanVehicleId) {
            vehicleDoc = await db.collection("vehicles").doc(cleanVehicleId).get();
            
            if (vehicleDoc.exists) {
                vehicleData = vehicleDoc.data();
                vehicleIdForRide = cleanVehicleId;
            }
        }
        
        // Si no se encontró, buscar por ownerId como alternativa
        if (!vehicleDoc || !vehicleDoc.exists) {
            const vehicleByOwner = await db.collection("vehicles")
                .where("ownerId", "==", userId)
                .limit(1)
                .get();
            
            if (vehicleByOwner.empty) {
                return res.status(404).json({
                    success: false,
                    message: "Vehículo no encontrado. Verifica que tengas un vehículo registrado."
                });
            }
            
            // Si se encontró por ownerId, usar ese vehículo
            const foundVehicle = vehicleByOwner.docs[0];
            vehicleData = foundVehicle.data();
            vehicleIdForRide = foundVehicle.id;
            
            // Actualizar el vehicleId en el usuario si no coincide
            if (foundVehicle.id !== cleanVehicleId) {
                await db.collection("users").doc(userId).update({
                    vehicleId: foundVehicle.id,
                    updatedAt: new Date()
                });
            }
        }
        
        // En este punto, vehicleData y vehicleIdForRide deberían estar definidos
        if (!vehicleData) {
            return res.status(404).json({
                success: false,
                message: "No se pudo obtener la información del vehículo"
            });
        }

        // Obtener la cantidad de asientos del vehículo (verificar diferentes nombres de campo)
        const vehicleSeats = vehicleData.seats || vehicleData.capacity || vehicleData.seatCapacity || vehicleData.seatsCapacity;
        
        if (!vehicleSeats) {
            return res.status(400).json({
                success: false,
                errors: {
                    capacity: "El vehículo no tiene información de asientos registrada"
                }
            });
        }

        // Validar que la capacidad del viaje no sea mayor a la cantidad de asientos del vehículo
        if (capacityNum > vehicleSeats) {
            return res.status(400).json({
                success: false,
                errors: {
                    capacity: `¡Máximo ${vehicleSeats} asientos!`
                }
            });
        }

        // Validar que pricePassenger sea un número entero positivo
        const priceNum = parseInt(pricePassenger);
        if (isNaN(priceNum) || priceNum <= 0 || parseFloat(pricePassenger) !== priceNum) {
            return res.status(400).json({
                success: false,
                errors: {
                    pricePassenger: "La tarifa debe ser un número entero positivo"
                }
            });
        }

        // Validar que departureTime sea una fecha válida futura
        const departureDate = new Date(departureTime);
        if (isNaN(departureDate.getTime())) {
            return res.status(400).json({
                success: false,
                errors: {
                    departureTime: "La fecha y hora de salida no es válida"
                }
            });
        }

        const now = new Date();
        if (departureDate <= now) {
            return res.status(400).json({
                success: false,
                errors: {
                    departureTime: "La fecha y hora de salida debe ser futura"
                }
            });
        }

        // Crear el documento del viaje
        const rideData = {
            driverId: userId,
            driverName: `${userData.name} ${userData.lastName}`, // Nombre completo del conductor
            driverContact: userData.contactNumber, // Contacto del conductor
            vehicleId: vehicleIdForRide,
            vehicle: {
                brand: vehicleData.brand || vehicleData.marca, // Marca del vehículo
                model: vehicleData.model || vehicleData.modelo, // Modelo del vehículo
                plate: vehicleData.plate || vehicleData.placa || null
            },
            departurePoint: departurePoint.trim(),
            destinationPoint: destinationPoint.trim(),
            route: route.trim(),
            departureTime: departureDate,
            capacity: capacityNum,
            availableSeats: capacityNum, // Inicialmente todos los asientos están disponibles
            pricePassenger: priceNum,
            status: "active", // Estado inicial del viaje
            passengers: [], // Array vacío inicialmente
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const rideRef = await db.collection("rides").add(rideData);

        // Agregar el ID del viaje al array 'rides' del usuario
        const userRides = userData.rides || []; // Obtener el array existente o inicializar como vacío
        userRides.push(rideRef.id);
        
        const userUpdateData = {
            rides: userRides,
            updatedAt: new Date()
        };
        
        // Solo actualizar vehicleId si es diferente al actual
        if (vehicleIdForRide !== cleanVehicleId) {
            userUpdateData.vehicleId = vehicleIdForRide;
        }
        
        await db.collection("users").doc(userId).update(userUpdateData);

        // Retornar el viaje creado
        res.status(201).json({
            success: true,
            message: "Viaje creado exitosamente",
            ride: {
                id: rideRef.id,
                ...rideData
            }
        });

    } catch (error) {
        console.error("Error creando viaje:", error);
        return res.status(500).json({
            success: false,
            message: "Error creando viaje",
            error: error.message
        });
    }
};
