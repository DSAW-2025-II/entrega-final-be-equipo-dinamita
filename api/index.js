console.log('Loading serverless function...');

import app from "../src/app.js";
import serverless from "serverless-http";

console.log('App imported, creating serverless handler...');

// Crear el handler serverless
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  request(request, event, context) {
    // Log completo del evento para debugging
    console.log('Full event structure:', {
      hasHeaders: !!event.headers,
      headerKeys: event.headers ? Object.keys(event.headers) : [],
      requestContext: event.requestContext ? Object.keys(event.requestContext) : [],
      hasRawPath: !!event.rawPath,
      rawPath: event.rawPath,
      path: event.path,
      requestUrl: request.url
    });
    
    // Obtener el path del requestContext (Vercel v2) o de otra fuente
    const requestContext = event.requestContext;
    let originalPath = null;
    
    // Intentar obtener el path de diferentes fuentes
    if (requestContext?.http?.path) {
      // Vercel v2 con requestContext.http.path
      originalPath = requestContext.http.path;
    } else if (event.rawPath) {
      // Vercel v2 con rawPath
      originalPath = event.rawPath;
    } else if (event.path && event.path !== '/') {
      // Vercel v1 o path diferente de '/'
      originalPath = event.path;
    } else {
      // Fallback: construir desde headers o usar request.url
      originalPath = request.url || '/';
    }
    
    // Si el path no empieza con /api, agregarlo
    // Esto maneja el caso donde Vercel pasa el path sin el prefijo
    if (originalPath && !originalPath.startsWith('/api')) {
      originalPath = `/api${originalPath.startsWith('/') ? '' : '/'}${originalPath}`;
    }
    
    // Aplicar el path al request
    if (originalPath) {
      request.url = originalPath;
      request.path = originalPath.split('?')[0];
    }
    
    console.log('Path resolved:', {
      originalPath: originalPath,
      requestPath: request.path,
      requestUrl: request.url,
      method: requestContext?.http?.method || event.httpMethod || request.method
    });
  }
});

console.log('Handler created, exporting...');

// Exportar el handler directamente para Vercel
export default handler;

