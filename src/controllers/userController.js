import { db } from "../config/firebase.js";

// Get current user profile (protected route)
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authMiddleware and contains the JWT payload
    const { userId } = req.user;
    
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
    console.error("❌ Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
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
