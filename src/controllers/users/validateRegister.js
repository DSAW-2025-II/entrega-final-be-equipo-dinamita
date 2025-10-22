export const validateUserRegistration = [
  // Name validation
  (req, res, next) => {
    const { name, lastName, universityId, email, contactNumber, password, photo } = req.body;

    // Check required fields
    if (!name || !lastName || !universityId || !email || !contactNumber || !password) {
      return res.status(400).json({
        success: false,
        error: "Se deben llenar todos los campos."
      });
    }

    // Validate university ID (6 digits)
    if (!/^\d{6}$/.test(universityId.toString())) {
      return res.status(400).json({
        success: false,
        error: "El ID de la universidad debe tener sólo 6 dígitos."
      });
    }

    // Validate email domain
    if (!email.endsWith('@unisabana.edu.co')) {
      return res.status(400).json({
        success: false,
        error: "Email debe terminar con @unisabana.edu.co"
      });
    }

    // Validate contact number (10 digits)
    if (!/^\d{10}$/.test(contactNumber.toString())) {
      return res.status(400).json({
        success: false,
        error: "Número telefónico debe tener 10 dígitos"
      });
    }

    // Validate password (at least 8 characters, 1 special character, 1 number)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Contraseña debe tener mínimo 8 caracteres"
      });
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Contraseña debe tener al menos un caracter especial"
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Contraseña debe tener al menos un número"
      });
    }

    // Validate name and lastName (not empty, reasonable length)
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: "El nombre debe tener entre 2 y 50 caracteres"
      });
    }

    if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: "El apellido debe tener entre 2 y 50 caracteres"
      });
    }

    next();
  }
];