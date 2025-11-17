import { db } from "../../config/firebase.js";

export const updateCurrentRole = async (req, res) => {
  try {
    const { userId } = req.user; // Del middleware de autenticación
    const { currentRole } = req.body;

    // Validar que el rol sea válido
    if (!currentRole || !["passenger", "driver"].includes(currentRole)) {
      return res.status(400).json({
        success: false,
        error: "Rol inválido. Debe ser 'passenger' o 'driver'"
      });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }

    const userData = userDoc.data();

    // Verificar que el usuario tenga el rol en su array de roles
    if (!userData.roles || !userData.roles.includes(currentRole)) {
      return res.status(400).json({
        success: false,
        error: `El usuario no tiene el rol '${currentRole}' disponible`
      });
    }

    // Actualizar currentRole
    await userRef.update({
      currentRole,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Rol actualizado a ${currentRole}`,
      user: {
        id: userId,
        currentRole,
        roles: userData.roles
      }
    });

  } catch (error) {
    console.error("❌ Error actualizando rol:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: error.message
    });
  }
};

