import { db } from "../../config/firebase.js";

export const validateUserRegistration = [
  async (req, res, next) => {
    const {
      name,
      lastName,
      universityId,
      email,
      contactNumber,
      password,
      photo
    } = req.body ?? {};

    const errors = {};

    // Helper to add message to a field (as array)
    const addError = (field, message) => {
      if (!errors[field]) errors[field] = [];
      errors[field].push(message);
    };

    // Check if user already exists by email
    if (email && !errors.email) {  // Solo verificar si el email es válido
      const existingUserByEmail = await db.collection("users")
        .where("email", "==", email.toLowerCase().trim())
        .limit(1)
        .get();

      if (!existingUserByEmail.empty) {
        addError("email", "¡Email ya registrado!");
      }
    }

    // Check if user already exists by university ID
    if (universityId && !errors.universityId) {  // Solo verificar si el ID es válido
      const existingUserByUniId = await db.collection("users")
        .where("universityId", "==", parseInt(universityId))
        .limit(1)
        .get();

      if (!existingUserByUniId.empty) {
        addError("universityId", "¡ID ya registrado!");
      }
    }

    if (Object.keys(errors).length > 0) {
      // Convert arrays to single string per field
      const formattedErrors = Object.fromEntries(
        Object.entries(errors).map(([field, msgs]) => [field, msgs.join(' ')])
      );

      return res.status(400).json({
        success: false,
        errors: formattedErrors
      });
    }

    next();
  }
];