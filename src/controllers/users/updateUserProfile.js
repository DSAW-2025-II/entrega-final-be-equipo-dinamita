import { db } from "../../config/firebase.js";

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    const { name, lastName, contactNumber } = req.body;
    
    // Validar que al menos un campo esté presente
    if (!name && !lastName && !contactNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Debe proporcionar al menos un campo para actualizar" 
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Construir objeto de actualización solo con los campos proporcionados
    const updateData = {
      updatedAt: new Date()
    };

    if (name) {
      if (name.trim().length < 2 || name.trim().length > 20) {
        return res.status(400).json({ 
          success: false, 
          errors: { name: "El nombre debe tener entre 2 y 20 caracteres" }
        });
      }
      updateData.name = name.trim();
    }

    if (lastName) {
      if (lastName.trim().length < 2 || lastName.trim().length > 20) {
        return res.status(400).json({ 
          success: false, 
          errors: { lastName: "El apellido debe tener entre 2 y 20 caracteres" }
        });
      }
      updateData.lastName = lastName.trim();
    }

    if (contactNumber) {
      // Validar que sea un número de teléfono válido (solo números, exactamente 10 dígitos)
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(contactNumber.trim())) {
        return res.status(400).json({ 
          success: false, 
          errors: { contactNumber: "El número de celular debe tener exactamente 10 dígitos" }
        });
      }
      updateData.contactNumber = contactNumber.trim();
    }

    // Actualizar datos del usuario
    await db.collection("users").doc(userId).update(updateData);

    // Obtener los datos actualizados del usuario
    const updatedUserDoc = await db.collection("users").doc(userId).get();
    const updatedUserData = updatedUserDoc.data();
    const { password, ...userWithoutPassword } = updatedUserData;

    res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: {
        id: updatedUserDoc.id,
        ...userWithoutPassword
      }
    });

  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return res.status(500).json({
      success: false,
      message: "Error actualizando perfil",
      error: error.message,
    });
  }
};
