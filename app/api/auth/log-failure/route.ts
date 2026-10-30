/**
 * API Route: POST /api/auth/log-failure
 *
 * Firebase Auth valida email/password en el cliente (nunca llega al
 * servidor si la contraseña es incorrecta), así que esos intentos
 * fallidos no quedaban registrados en los logs de seguridad.
 * Este endpoint deja que la página de login reporte el intento fallido
 * para que aparezca en el panel de administrador.
 *
 * NUNCA se recibe ni se registra la contraseña, solo el correo y el
 * código de error que devuelve Firebase (ej. auth/wrong-password).
 */
import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/captcha";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/logger";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);

    const resource = "/api/auth/log-failure";
    const rl = rateLimit(ip, resource, RATE_LIMITS[resource]);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Demasiadas peticiones." }, { status: 429 });
    }

    const { email, code } = await request.json();
    const safeEmail = typeof email === "string" ? email.slice(0, 200) : "desconocido";
    const safeCode = typeof code === "string" ? code.slice(0, 100) : "error_desconocido";

    logSecurityEvent(
      "login_error",
      ip,
      `Intento de login fallido para ${safeEmail} (${safeCode})`,
      { email: safeEmail, code: safeCode },
      401
    );

    return NextResponse.json({ status: "logged" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error al registrar el fallo de login:", error);
    return NextResponse.json({ error: "No se pudo registrar el evento" }, { status: 500 });
  }
}
