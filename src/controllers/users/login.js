import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "../../config/firebase.js";

// Login endpoint
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔐 Login attempt for:", email);

    // Find user by email
    const userSnapshot = await db.collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .where("isActive", "==", true)
      .limit(1)
      .get();


    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    console.log("✅ User logged in successfully:", userData.email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userDoc.id,
        email: userData.email,
        role: userData.role
      },
      process.env.JWT_SECRET || "your-secret-key", // In production, use a proper secret
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: userDoc.id,
        name: userData.name,
        lastName: userData.lastName,
        email: userData.email,
        roles: [userData.role]
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during login",
      details: error.message
    });
  }
};