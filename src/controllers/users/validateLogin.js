import { db } from "../../config/firebase.js";
import bcrypt from "bcrypt";

export const validateLogin = [
  async (req, res, next) => {
    const { email, password } = req.body ?? {};
    const errors = {};

    // Helper to add message to a field
    const addError = (field, message) => {
      if (!errors[field]) errors[field] = [];
      errors[field].push(message);
    };

    // Validate required fields
    if (!email) {
      addError("email", "¡Email requerido!");
    }

    if (!password) {
      addError("password", "¡Contraseña requerida!");
    }

    // Validate email domain if email exists
    if (email && !email.endsWith('@unisabana.edu.co')) {
      addError("email", "¡Falta @unisabana.edu.co!");
    }

    // Check if user exists and password matches
    if (email && !errors.email) {
      const userSnapshot = await db.collection("users")
        .where("email", "==", email.toLowerCase().trim())
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        addError("email", "¡Usuario no encontrado!");
      } else {
        const userData = userSnapshot.docs[0].data();
        const passwordMatch = await bcrypt.compare(password, userData.password);
        
        if (!passwordMatch) {
          addError("password", "¡Contraseña incorrecta!");
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      const formattedErrors = Object.fromEntries(
        Object.entries(errors).map(([field, msgs]) => [field, msgs.join(' ')])
      );

      return res.status(400).json({
        success: false,
        errors: formattedErrors
      });
    }

    // Add user data to request for login controller
    if (!errors.email && !errors.password) {
      const userDoc = (await db.collection("users")
        .where("email", "==", email.toLowerCase().trim())
        .limit(1)
        .get()).docs[0];
      
      req.userData = {
        id: userDoc.id,
        ...userDoc.data()
      };
    }

    next();
  }
];