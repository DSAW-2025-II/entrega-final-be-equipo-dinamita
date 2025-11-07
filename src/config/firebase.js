import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import path from "path";

let serviceAccount;
let db;

try {
  if (process.env.FIREBASE_CREDENTIALS) {
    // Caso PRODUCCIÓN (Vercel/Render): las credenciales vienen del .env
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } catch (error) {
      console.error("Error parseando FIREBASE_CREDENTIALS:", error);
      throw new Error("FIREBASE_CREDENTIALS no es un JSON válido");
    }
  } else {
    // Caso LOCAL: leemos el archivo físico
    const serviceAccountPath = path.resolve("./src/config/serviceAccountKey.json");
    if (!existsSync(serviceAccountPath)) {
      throw new Error("No se encontró serviceAccountKey.json ni FIREBASE_CREDENTIALS");
    }
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  }

  // Verificar que Firebase no esté ya inicializado (evitar re-inicialización)
  if (admin.apps.length === 0) {
    // Inicializar Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin inicializado correctamente");
  } else {
    console.log("Firebase Admin ya estaba inicializado");
  }

  db = admin.firestore();
} catch (error) {
  console.error("❌ Error inicializando Firebase Admin:", error);
  // No lanzar el error inmediatamente, permitir que el servidor inicie
  // Los errores se manejarán cuando se intenten usar las funciones de Firebase
}

export { admin, db };