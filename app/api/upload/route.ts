import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // Tipamos el archivo como File o null
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Convertimos a Buffer para Node.js
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /**
     * Prometizamos la subida. 
     * Usamos <UploadApiResponse> para que TypeScript sepa que 
     * el 'result' tendrá propiedades como .secure_url y .public_id
     */
    const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: "auto", 
          folder: "after-rewind" 
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Error en la subida a Cloudinary"));
          } else {
            resolve(result); // Aquí result ya tiene el tipo correcto
          }
        }
      ).end(buffer);
    });

    // Ahora podemos acceder a .secure_url con autocompletado y sin errores
    return NextResponse.json({ url: uploadResponse.secure_url });

  } catch (error: unknown) {
    // Manejo de errores sin 'any' usando unknown + instanceof
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error uploading file:", errorMessage);
    return NextResponse.json(
      { error: "Error al subir el archivo a Cloudinary" }, 
      { status: 500 }
    );
  }
}