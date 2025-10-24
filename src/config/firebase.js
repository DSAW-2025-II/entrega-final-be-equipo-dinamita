import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import path from "path";

let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
  // Caso PRODUCCIÓN (Render): las credenciales vienen del .env
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
  // Caso LOCAL: leemos el archivo físico
  const serviceAccountPath = path.resolve("./src/config/serviceAccountKey.json");
  if (!existsSync(serviceAccountPath)) {
    throw new Error("No se encontró serviceAccountKey.json ni FIREBASE_CREDENTIALS");
  }
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export { admin, db };

console.log("Firebase Admin inicializado correctamente");