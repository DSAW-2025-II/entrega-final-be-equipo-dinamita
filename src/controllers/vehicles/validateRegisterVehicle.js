import { db } from "../../config/firebase.js";

export const validateRegisterVehicle = [
  async (req, res, next) => {
    const { brand, model, plate, capacity, photo, soat } = req.body ?? {};
    const errors = {};
    const userId = req.user?.userId;

    // Verificar que el usuario no tenga ya un vehículo registrado
    if (userId) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.vehicleId) {
          return res.status(400).json({
            success: false,
            errors: {
              vehicle: "Ya tienes un vehículo registrado. Solo puedes tener un vehículo por usuario."
            }
          });
        }
      }
    }

    // Validar campos requeridos (no vacíos)
    if (!brand || !brand.trim()) {
      errors.brand = "Marca es requerida";
    }
    if (!model || !model.trim()) {
      errors.model = "Modelo es requerido";
    }
    if (!plate || !plate.trim()) {
      errors.plate = "Placa es requerida";
    } else {
      // Validar formato de placa: 3 letras seguidas de 3 números (ej: ABC123)
      const plateRegex = /^[A-Za-z]{3}\d{3}$/;
      const plateNormalized = plate.trim().toUpperCase();
      
      if (!plateRegex.test(plateNormalized)) {
        errors.plate = "La placa debe tener 3 letras seguidas de 3 números (ej: ABC123)";
      } else {
        // Verificar que la placa no esté ya registrada en la base de datos
        const existingVehicle = await db.collection("vehicles")
          .where("plate", "==", plateNormalized)
          .limit(1)
          .get();

        if (!existingVehicle.empty) {
          errors.plate = "Esta placa ya está registrada en el sistema";
        }
      }
    }

    // Validar capacidad: entre 1 y 5
    if (!capacity) {
      errors.capacity = "Capacidad es requerida";
    } else {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 4) {
        errors.capacity = "La capacidad debe ser entre 1 y 4";
      }
    }

    // Validar que se estén subiendo fotos
    if (!photo || !photo.trim()) {
      errors.photo = "La foto del vehículo es requerida";
    }
    if (!soat || !soat.trim()) {
      errors.soat = "La foto del SOAT es requerida";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  }
];

