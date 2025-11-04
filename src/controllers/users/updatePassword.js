import { db } from "../../config/firebase.js";
import bcrypt from "bcrypt";

export const updatePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Validar que ambos campos estén presentes
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        errors: { general: "Debe proporcionar la contraseña actual y la nueva contraseña" }
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();

    // Verificar que la contraseña actual sea correcta
    const passwordMatch = await bcrypt.compare(currentPassword, userData.password);
    
    if (!passwordMatch) {
      return res.status(400).json({ 
        success: false, 
        errors: { currentPassword: "La contraseña actual es incorrecta" }
      });
    }

    // Validar la nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        errors: { newPassword: "La contraseña debe tener al menos 8 caracteres" }
      });
    }

    // Verificar que tenga al menos un número
    const hasNumber = /\d/.test(newPassword);
    if (!hasNumber) {
      return res.status(400).json({ 
        success: false, 
        errors: { newPassword: "La contraseña debe contener al menos un número" }
      });
    }

    // Verificar que tenga al menos un carácter especial
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasSpecialChar) {
      return res.status(400).json({ 
        success: false, 
        errors: { newPassword: "La contraseña debe contener al menos un carácter especial" }
      });
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const newPasswordMatch = await bcrypt.compare(newPassword, userData.password);
    if (newPasswordMatch) {
      return res.status(400).json({ 
        success: false, 
        errors: { newPassword: "La nueva contraseña debe ser diferente a la contraseña actual" }
      });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar la contraseña
    await db.collection("users").doc(userId).update({
      password: hashedPassword,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente"
    });

  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    return res.status(500).json({
      success: false,
      message: "Error actualizando contraseña",
      error: error.message,
    });
  }
};
