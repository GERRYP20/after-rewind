import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { idToken } = await request.json();
    
    // Configuramos la expiración (5 días)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    // Creamos la cookie de sesión de Firebase
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const cookieStore = await cookies();
    
    // CRÍTICO: path: "/" permite que la cookie se envíe a /api/invitations
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