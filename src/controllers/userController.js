import { db } from "../config/firebase.js";
import bcrypt from "bcrypt";

// Utility function to compare passwords (for future login functionality)
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Validation middleware
export const validateUserRegistration = [
  // Name validation
  (req, res, next) => {
    const { name, lastName, universityId, email, contactNumber, password, photo } = req.body;
    
    // Check required fields
    if (!name || !lastName || !universityId || !email || !contactNumber || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, lastName, universityId, email, contactNumber, password"
      });
    }

    // Validate university ID (6 digits)
    if (!/^\d{6}$/.test(universityId.toString())) {
      return res.status(400).json({
        success: false,
        error: "University ID must be exactly 6 digits"
      });
    }

    // Validate email domain
    if (!email.endsWith('@unisabana.edu.co')) {
      return res.status(400).json({
        success: false,
        error: "Email must end with @unisabana.edu.co"
      });
    }

    // Validate contact number (10 digits)
    if (!/^\d{10}$/.test(contactNumber.toString())) {
      return res.status(400).json({
        success: false,
        error: "Contact number must be exactly 10 digits"
      });
    }

    // Validate password (at least 8 characters, 1 special character, 1 number)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long"
      });
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain at least 1 special character"
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain at least 1 number"
      });
    }

    // Validate name and lastName (not empty, reasonable length)
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: "Name must be between 2 and 50 characters"
      });
    }

    if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: "Last name must be between 2 and 50 characters"
      });
    }

    next();
  }
];

// Register user endpoint
export const registerUser = async (req, res) => {
  try {
    const { name, lastName, universityId, email, contactNumber, password, photo } = req.body;
    
    console.log("📝 Registering new user:", { name, lastName, universityId, email, contactNumber });

    // Check if user already exists by email
    const existingUserByEmail = await db.collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingUserByEmail.empty) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists"
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
        error: "User with this university ID already exists"
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

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const userData = userDoc.data();
    
    // Remove password from response for security
    const { password, ...userWithoutPassword } = userData;
    
    res.status(200).json({
      success: true,
      user: {
        id: userDoc.id,
        ...userWithoutPassword
      }
    });

  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users")
      .where("isActive", "==", true)
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // Remove password from response for security
      const { password, ...userWithoutPassword } = userData;
      users.push({
        id: doc.id,
        ...userWithoutPassword
      });
    });

    // Sort by createdAt in JavaScript instead of Firestore
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error("❌ Get all users error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};
