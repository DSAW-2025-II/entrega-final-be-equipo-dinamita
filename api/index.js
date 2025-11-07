import app from "../src/app.js";
import serverless from "serverless-http";

// Crear el handler serverless
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  request(request, event, context) {
    // Vercel automáticamente detecta funciones en /api/ y expone /api/*
    // El path debería estar en rawPath (Vercel v2) o path (Vercel v1)
    const rawPath = event.rawPath || event.path;
    
    // Si rawPath existe y es diferente del request.url, usarlo
    if (rawPath && rawPath !== request.url) {
      request.url = rawPath;
      request.path = rawPath.split('?')[0];
    }
    
    // Log para debugging
    console.log('Vercel request:', {
      rawPath: event.rawPath,
      path: event.path,
      requestUrl: request.url,
      requestPath: request.path,
      method: event.requestContext?.http?.method || event.httpMethod || request.method
    });
  }
});

// Wrapper para manejar errores y asegurar que siempre se responda
export default async (event, context) => {
  // Evitar que la función espere indefinidamente
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    const result = await handler(event, context);
    return result;
  } catch (error) {
    console.error('Error en handler serverless:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      })
    };
  }
};

