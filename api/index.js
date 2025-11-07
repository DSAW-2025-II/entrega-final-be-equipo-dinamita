import app from "../src/app.js";
import serverless from "serverless-http";

// Crear el handler serverless
// serverless-http maneja automáticamente la conversión entre eventos de Vercel y Express
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});

export default handler;

