import jwt from "jsonwebtoken";

// Verify JWT token endpoint
export const verifyToken = async (req, res) => {
  try {
    // User info is already attached by authMiddleware
    // If we get here, the token is valid
    res.status(200).json({
      success: true,
      message: "Token is valid",
      user: req.user
    });
  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }
};

