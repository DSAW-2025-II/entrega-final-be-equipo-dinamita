import sharp from "sharp";

/**
 * Comprime una imagen y la convierte a base64
 * @param {Buffer} buffer - Buffer de la imagen original
 * @param {string} mimetype - Tipo MIME de la imagen (ej: 'image/jpeg', 'image/png')
 * @param {number} maxWidth - Ancho máximo en píxeles (default: 800)
 * @param {number} maxHeight - Alto máximo en píxeles (default: 800)
 * @param {number} quality - Calidad de compresión para JPEG (default: 80, range: 1-100)
 * @returns {Promise<string>} - String base64 de la imagen comprimida
 */
export const compressImageToBase64 = async (
  buffer,
  mimetype,
  maxWidth = 800,
  maxHeight = 800,
  quality = 80
) => {
  try {
    let compressedBuffer;
    // Para SVG, asegurar que se renderice a un tamaño decente
    const isSvg = mimetype.includes('svg');
    let sharpInstance = sharp(buffer);
    
    if (isSvg) {
      // Para SVG, forzar renderizado a tamaño específico (sin withoutEnlargement)
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Fondo transparente
      });
    } else {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Determinar el formato de salida basado en el mimetype
    // SVG se convierte a PNG para mantener transparencia
    const format = mimetype.includes('png') || mimetype.includes('svg') ? 'png' : 'jpeg';
    
    // Aplicar compresión según el formato
    if (format === 'png') {
      // Para SVG, usar menor compresión (mejor calidad), para PNG normal usar compresión media
      // compressionLevel: 0 = sin compresión (mejor calidad), 9 = máxima compresión
      const compressionLevel = isSvg ? 2 : 6; // SVG menos comprimido para mejor calidad
      sharpInstance = sharpInstance.png({ 
        compressionLevel
      });
    } else {
      // Convertir a JPEG para mejor compresión, pero con alta calidad
      sharpInstance = sharpInstance.jpeg({ quality: Math.max(quality, 90) });
    }
    
    // Comprimir y redimensionar la imagen
    compressedBuffer = await sharpInstance.toBuffer();
    
    // Convertir a base64
    const base64 = compressedBuffer.toString('base64');
    const outputMimetype = format === 'png' ? 'image/png' : 'image/jpeg';
    const base64String = `data:${outputMimetype};base64,${base64}`;
    
    // Verificar que el tamaño final sea menor a 900KB (dejando margen para otros campos)
    const sizeInBytes = Buffer.byteLength(base64String, 'utf8');
    if (sizeInBytes > 900 * 1024) {
      // Si aún es muy grande, comprimir más agresivamente
      let recompressInstance = sharp(buffer).resize(
        Math.floor(maxWidth * 0.7), 
        Math.floor(maxHeight * 0.7), 
        {
          fit: 'inside',
          withoutEnlargement: true
        }
      );
      
      if (format === 'png') {
        // Mantener mejor calidad incluso en recompresión
        const compressionLevel = isSvg ? 4 : 7;
        recompressInstance = recompressInstance.png({ 
          compressionLevel,
          quality: 100
        });
      } else {
        // Para JPEG, usar calidad más baja para compresión más agresiva
        recompressInstance = recompressInstance.jpeg({ quality: Math.max(70, quality - 10) });
      }
      
      compressedBuffer = await recompressInstance.toBuffer();
      const newBase64 = compressedBuffer.toString('base64');
      return `data:${outputMimetype};base64,${newBase64}`;
    }
    
    return base64String;
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    // Si falla la compresión, intentar con la imagen original (pero con warning)
    console.warn("⚠️ Usando imagen original sin comprimir (puede ser demasiado grande)");
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }
};

