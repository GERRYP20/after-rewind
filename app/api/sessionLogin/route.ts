import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Extraemos el ID Token enviado por el cliente (generado tras el login de Firebase)
    const { idToken } = await request.json();
    
    // Definimos el tiempo de vida de la sesión (5 días)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    // Generamos la cookie de sesión oficial usando el SDK de Firebase Admin
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const cookieStore = await cookies();
    
    // Guardamos la cookie de sesión en el navegador
    // El path "/" es vital para que la cookie esté disponible en todas las rutas de la API
    cookieStore.set(COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/", 
      sameSite: "lax",
    });

    console.log("Session cookie set with name:", COOKIE_NAME);

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}