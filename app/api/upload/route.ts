import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { deleteFromCloudinary } from "@/lib/cloudinary-utils";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST: Sube un archivo a Cloudinary y retorna la URL
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary usando una promesa para manejar el stream
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "after-rewind", // Carpeta organizada para el proyecto
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ 
      url: result.secure_url,
      public_id: result.public_id 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error uploading file:", errorMessage);
    return NextResponse.json(
      { error: "Error al subir el archivo a Cloudinary" }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE: Elimina una imagen físicamente de Cloudinary.
 * Requiere que el usuario esté autenticado.
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verificar sesión
    const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await adminAuth.verifySessionCookie(sessionCookie, false);

    // 2. Obtener URL del body
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL no proporcionada" }, { status: 400 });
    }

    // 3. Eliminar físicamente
    const success = await deleteFromCloudinary(url);

    if (success) {
      return NextResponse.json({ message: "Imagen eliminada de Cloudinary" });
    } else {
      return NextResponse.json({ error: "No se pudo eliminar la imagen" }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error en DELETE /api/upload:", error);
    return NextResponse.json({ error: "Error al procesar el borrado" }, { status: 500 });
  }
}
