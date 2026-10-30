/**
 * API de Logout
 * 
 * Esta ruta elimina la cookie de sesión del servidor
 * cuando el usuario cierra sesión.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { getClientIp } from "@/lib/captcha";
import { logSecurityEvent } from "@/lib/logger";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function POST(request: Request) {
  // Identificamos al usuario antes de borrar la cookie de sesión
  const user = await getServerUser();
  const ip = getClientIp(request);

  logSecurityEvent(
    "logout",
    ip,
    user?.email ? `Sesión cerrada por ${user.email}` : "Sesión cerrada",
    user?.email ? { email: user.email } : undefined,
    200
  );

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