import app from "../src/app.js";
import serverless from "serverless-http";

// Crear el handler serverless con opciones para manejar archivos binarios
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});

// Exportar el handler directamente - serverless-http ya maneja los errores
export default handler;

