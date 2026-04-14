/**
 * API de Logout
 * 
 * Esta ruta elimina la cookie de sesión del servidor
 * cuando el usuario cierra sesión.
 */
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Eliminar la cookie de sesión设定的cookie名称为 session
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // 立即过期
    path: "/",
  });

  return response;
}