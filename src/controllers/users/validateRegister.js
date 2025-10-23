export const validateUserRegistration = [
  (req, res, next) => {
    const {
      name,
      lastName,
      universityId,
      email,
      contactNumber,
      password,
      photo
    } = req.body ?? {};

    const errors = {};

    // Helper to add message to a field (as array)
    const addError = (field, message) => {
      if (!errors[field]) errors[field] = [];
      errors[field].push(message);
    };

    // If universityId present validate format
    if (universityId !== undefined && universityId !== null && String(universityId).trim() !== "") {
      if (!/^\d{6}$/.test(String(universityId))) {
        addError("universityId", "¡Id de 6 dígitos!");
      }
    }

    // Email domain
    if (email) {
      if (typeof email !== "string" || !email.toLowerCase().endsWith("@unisabana.edu.co")) {
        addError("email", "¡Falta @unisabana.edu.co!");
      }
    }

    // Contact number (10 digits)
    if (contactNumber !== undefined && contactNumber !== null && String(contactNumber).trim() !== "") {
      if (!/^\d{10}$/.test(String(contactNumber))) {
        addError("contactNumber", "¡Teléfono de 10 dígitos!");
      }
    }

    // Password rules
    if (password) {
      if (String(password).length < 8) {
        addError("password", "¡Mínimo 8 caracteres!");
      }
      else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(String(password))) {
        addError("password", "¡Al menos un caracter especial!");
      }
      else if (!/(?=.*\d)/.test(String(password))) {
        addError("password", "¡Al menos un número!");
      }
    }

    // Name and lastName length
    if (name && (String(name).trim().length < 2 || String(name).trim().length > 10)) {
      addError("name", "¡Entre 2 y 10 caracteres!");
    }
    if (lastName && (String(lastName).trim().length < 2 || String(lastName).trim().length > 10)) {
      addError("lastName", "¡Entre 2 y 10 caracteres!");
    }

    if (Object.keys(errors).length > 0) {
      // Convert arrays to single string per field (separador: espacio)
      const formattedErrors = Object.fromEntries(
        Object.entries(errors).map(([field, msgs]) => [field, msgs.join(' ')])
      );

      return res.status(400).json({
        success: false,
        errors: formattedErrors
      });
    }

    next();
  }
];