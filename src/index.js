import app from "./app.js";

// Handler para Vercel sin serverless-http
// @vercel/node convierte automáticamente Express a handler de Vercel
// Solo necesitamos exportar la app de Express
export default app;

