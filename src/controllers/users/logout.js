// Logout endpoint - Safe to call with or without a valid session
export const logoutUser = async (req, res) => {
  try {
    // Always return success, whether user has a valid session or not
    // This makes the logout endpoint safe to call from any state
    res.status(200).json({
      success: true,
      message: "User logged out successfully"
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    // Even on error, return 200 to maintain safety
    res.status(200).json({
      success: true,
      message: "User logged out successfully"
    });
  }
};

