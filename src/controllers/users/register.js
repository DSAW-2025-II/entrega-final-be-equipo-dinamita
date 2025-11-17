import { db } from "../../config/firebase.js";
import bcrypt from "bcrypt";
import { compressImageToBase64 } from "../../utils/imageCompression.js";

export const registerUser = async (req, res) => {
  try {    
    const { name, lastName, universityId, email, contactNumber, password } = req.body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!name || !lastName || !universityId || !email || !contactNumber || !password) {
      return res.status(400).json({
        success: false,
        errors: {
          general: "Todos los campos son requeridos",
          missing: {
            name: !name,
            lastName: !lastName,
            universityId: !universityId,
            email: !email,
            contactNumber: !contactNumber,
            password: !password
          }
        }
      });
    }

    // Convertir archivo de multer a base64 si existe (con compresión)
    let photoBase64 = null;
    if (req.files && req.files.photo && req.files.photo[0]) {
      const photoFile = req.files.photo[0];
      // Para imágenes de perfil, usar mayor resolución y mejor calidad
      const isSvg = photoFile.mimetype === 'image/svg+xml';
      photoBase64 = await compressImageToBase64(
        photoFile.buffer,
        photoFile.mimetype,
        isSvg ? 512 : 1200, // maxWidth - SVG más pequeño, fotos normales más grandes
        isSvg ? 512 : 1200, // maxHeight
        95   // quality más alta para mejor calidad
      );
    } else if (req.file) {
      // Fallback para compatibilidad si se usa .single() en algún lugar
      const isSvg = req.file.mimetype === 'image/svg+xml';
      photoBase64 = await compressImageToBase64(
        req.file.buffer,
        req.file.mimetype,
        isSvg ? 512 : 1200, // maxWidth
        isSvg ? 512 : 1200, // maxHeight
        95   // quality más alta
      );
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user document
    const userData = {
      name: name.trim(),
      lastName: lastName.trim(),
      universityId: parseInt(universityId),
      email: email.toLowerCase().trim(),
      contactNumber: contactNumber.toString(),
      password: hashedPassword, // Now properly hashed
      photo: photoBase64 || process.env.DEFAULT_PROFILE_PIC, // Optional photo from multer
      roles: ["passenger"], // Array de roles, inicializado como pasajero
      currentRole: "passenger", // Rol actual del usuario
      requests: [], // Solicitudes de viajes aceptados por el usuario
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Add user to Firestore
    const userRef = await db.collection("users").add(userData);
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: userRef.id,
      user: {
        id: userRef.id,
        name: userData.name,
        lastName: userData.lastName,
        universityId: userData.universityId,
        email: userData.email,
        contactNumber: userData.contactNumber,
        photo: userData.photo,
        roles: userData.roles,
        currentRole: userData.currentRole,
        requests: userData.requests,
        createdAt: userData.createdAt
      }
    });

  } catch (error) {
    console.error("❌ User registration error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Internal server error during registration",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const uploadUserPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({
        success: false,
        error: "Photo data is required",
      });
    }

    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await userRef.update({
      photo,
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
    });

  } catch (error) {
    console.error("❌ Error uploading photo:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during photo upload",
      details: error.message,
    });
  }
}