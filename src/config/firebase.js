import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

const serviceAccountPath = path.resolve("./src/config/serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export { admin, db };

console.log("Funcionando")