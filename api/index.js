console.log('Loading serverless function...');

import app from "../src/app.js";
import serverless from "serverless-http";

console.log('App imported, creating serverless handler...');

// Crear el handler serverless
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  request(request, event, context) {
    // Con rewrites, Vercel pasa el path original en rawPath
    // Necesitamos usar ese path para que Express lo procese correctamente
    const rawPath = event.rawPath;
    
    if (rawPath) {
      request.url = rawPath;
      request.path = rawPath.split('?')[0];
    }
    
    console.log('Vercel event:', {
      rawPath: event.rawPath,
      path: event.path,
      url: request.url,
      method: event.requestContext?.http?.method || event.httpMethod || request.method
    });
  }
});

console.log('Handler created, exporting...');

// Exportar el handler directamente para Vercel
export default handler;

