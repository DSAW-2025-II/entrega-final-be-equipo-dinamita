// Login validation middleware
export const validateLogin = [
  (req, res, next) => {
    const { email, password } = req.body;
    
    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password"
      });
    }

    // Validate email domain
    if (!email.endsWith('@unisabana.edu.co')) {
      return res.status(400).json({
        success: false,
        error: "Email must end with @unisabana.edu.co"
      });
    }

    next();
  }
];