import { db } from "../../config/firebase.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  try {
    const { name, lastName, universityId, email, contactNumber, password, photo } = req.body;
    
    console.log("Registering new user:", { name, lastName, universityId, email, contactNumber });

    // Check if user already exists by email
    const existingUserByEmail = await db.collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingUserByEmail.empty) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un usuario con este email. Intente otro."
      });
    }

    // Check if user already exists by university ID
    const existingUserByUniId = await db.collection("users")
      .where("universityId", "==", parseInt(universityId))
      .limit(1)
      .get();

    if (!existingUserByUniId.empty) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un usuario con este ID. Intente de nuevo."
      });
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
      photo: photo || null, // Optional photo
      role: "passenger", // Default role
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Add user to Firestore
    const userRef = await db.collection("users").add(userData);
    
    console.log("User registered successfully with ID:", userRef.id);

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
        role: userData.role,
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
    const { userId } = req.params;
    const { photo } = req.body;
    const { userId: authenticatedUserId } = req.user; // From authMiddleware

    // Check if user is trying to update their own photo
    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own photo",
      });
    }

    if (!photo) {
      return res.status(400).json({
        success: false,
        error: "Photo data is required",
      });
    }

    // Basic photo validation (assuming base64 or URL)
    if (typeof photo !== 'string' || photo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Photo must be a valid string (base64 or URL)",
      });
    }

    const userRef = db.collection("users").doc(userId);
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
    console.error("Error uploading photo:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during photo upload",
      details: error.message,
    });
  }
}