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