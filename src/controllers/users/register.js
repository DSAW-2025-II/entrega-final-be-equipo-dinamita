import { db } from "../../config/firebase.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  try {
    const { name, lastName, universityId, email, contactNumber, password } = req.body;
    
    console.log("📝 Registering new user:", { name, lastName, universityId, email, contactNumber });

    // Convertir archivo de multer a base64 si existe
    let photoBase64 = null;
    if (req.file) {
      photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
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
      photo: photoBase64 || null, // Optional photo from multer
      roles: ["passenger"], // Array de roles, inicializado como pasajero
      currentRole: "passenger", // Rol actual del usuario
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Add user to Firestore
    const userRef = await db.collection("users").add(userData);
    
    console.log("✅ User registered successfully with ID:", userRef.id);

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
        createdAt: userData.createdAt
      }
    });

  } catch (error) {
    console.error("❌ User registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during registration",
      details: error.message
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