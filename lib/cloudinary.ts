import {v2 as cloudinary} from "cloudinary";

// Configuración global de Cloudinary para el manejo de imágenes
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;