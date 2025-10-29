import jwt from "jsonwebtoken";

// Optional authentication middleware - doesn't fail if token is missing or invalid
// This is useful for endpoints that should work with or without authentication
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token extraction

  if (!token) {
    // No token provided, continue without user info
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      // Invalid token, continue without user info
      req.user = null;
      return next();
    }

    // Valid token, attach user info
    req.user = user;
    next();
  });
};

export default optionalAuthMiddleware;

