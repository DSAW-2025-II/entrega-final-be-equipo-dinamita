import app from "../src/app.js";
import serverless from "serverless-http";

// Crear el handler serverless
// serverless-http maneja automáticamente la conversión entre eventos de Vercel y Express
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  request(request, event, context) {
    // Vercel captura /api/(.*) y pasa solo la parte capturada
    // Necesitamos reconstruir el path completo con /api/ prefix
    const originalPath = event.path || request.url;
    
    // Si el path no empieza con /api/, lo agregamos
    if (!originalPath.startsWith('/api')) {
      request.url = `/api${originalPath}`;
      request.path = `/api${originalPath}`;
    } else {
      request.url = originalPath;
      request.path = originalPath;
    }
    
    console.log('Request path ajustado:', {
      original: event.path,
      adjusted: request.path,
      url: request.url
    });
  }
});

export default handler;

