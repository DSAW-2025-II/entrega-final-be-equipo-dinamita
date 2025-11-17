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
    let sharpInstance = sharp(buffer).resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
    
    // Determinar el formato de salida basado en el mimetype
    const format = mimetype.includes('png') ? 'png' : 'jpeg';
    
    // Aplicar compresión según el formato
    if (format === 'png') {
      sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    } else {
      // Convertir a JPEG para mejor compresión
      sharpInstance = sharpInstance.jpeg({ quality });
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
        recompressInstance = recompressInstance.png({ compressionLevel: 9 });
      } else {
        recompressInstance = recompressInstance.jpeg({ quality: Math.max(60, quality - 20) });
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

