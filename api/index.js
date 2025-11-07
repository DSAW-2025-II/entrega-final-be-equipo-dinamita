import app from "../src/app.js";
import serverless from "serverless-http";

// Crear el handler serverless
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  request(request, event, context) {
    // Vercel captura /api/(.*) y pasa la parte capturada como query param 'path'
    // Necesitamos reconstruir el path completo /api/{captured}
    const capturedPath = event.queryStringParameters?.path || event.path || '/';
    
    // Construir el path completo
    const fullPath = capturedPath === '/' 
      ? '/api/' 
      : `/api/${capturedPath.startsWith('/') ? capturedPath.slice(1) : capturedPath}`;
    
    request.url = fullPath;
    request.path = fullPath.split('?')[0];
    
    console.log('Path reconstruction:', {
      captured: capturedPath,
      queryParams: event.queryStringParameters,
      eventPath: event.path,
      finalPath: request.path
    });
  }
});

export default handler;

