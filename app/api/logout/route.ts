/**
 * API de Logout
 * 
 * Esta ruta elimina la cookie de sesión del servidor
 * cuando el usuario cierra sesión.
 */
import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function POST() {
  // Preparamos la respuesta de éxito
  const response = NextResponse.json({ success: true });

  // Limpiamos la cookie de sesión del navegador
  // Al establecer maxAge en 0, el navegador la borrará inmediatamente
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, 
    path: "/",
  });

  return response;
}