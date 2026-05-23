import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary (se debe asegurar que las variables de entorno estén presentes)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extrae el public_id de una URL de Cloudinary.
 * Ejemplo: https://res.cloudinary.com/cloud/image/upload/v12345/after-rewind/foto.jpg
 * Retorna: after-rewind/foto
 */
export function extractPublicId(url: string): string | null {
  try {
    // Busca la parte de la URL después de /upload/ (ignorando la versión vXXXXX/)
    // y antes de la extensión del archivo
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match = url.match(regex);
    
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error al extraer public_id:", error);
    return null;
  }
}

/**
 * Elimina una imagen físicamente de Cloudinary a partir de su URL completa.
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  if (!url || !url.includes("res.cloudinary.com")) return false;

  const publicId = extractPublicId(url);
  if (!publicId) {
    console.warn("No se pudo extraer el public_id de la URL:", url);
    return false;
  }

  try {
    console.log(`Intentando eliminar de Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Error al destruir imagen en Cloudinary:", error);
    return false;
  }
}
