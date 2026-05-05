/**
 * API de Logout
 * 
 * Esta ruta elimina la cookie de sesión del servidor
 * cuando el usuario cierra sesión.
 */
import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Eliminar la cookie de sesión
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, 
    path: "/",
  });

  return response;
}