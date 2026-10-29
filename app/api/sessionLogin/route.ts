import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getClientIp,
  isBlocked,
  registerFailure,
  resetFailures,
  verifySlider,
} from "@/lib/captcha";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/logger";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Extraemos el ID Token y los datos del slider puzzle
    const { idToken, captchaToken, captchaOffsetX, captchaOffsetY } =
      await request.json();

    // Identificamos al cliente para aplicar el bloqueo por intentos fallidos
    const ip = getClientIp(request);

    // 0. Rate limiting general: frena el intento de forzar la sesión por fuerza bruta
    const resource = "/api/sessionLogin";
    const rl = rateLimit(ip, resource, RATE_LIMITS[resource]);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // 1. Si la IP está bloqueada, no procesamos nada
    const block = isBlocked(ip);
    if (block.blocked) {
      return NextResponse.json(
        { error: "Demasiados intentos fallidos. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(block.retryAfter) } }
      );
    }

    // 2. Validamos el desafío visual antes de crear la sesión
    const captcha = verifySlider(captchaToken, captchaOffsetX, captchaOffsetY);
    if (!captcha.ok) {
      const failure = registerFailure(ip);
      if (failure.blocked) {
        return NextResponse.json(
          { error: "Demasiados intentos fallidos. Espera un momento." },
          { status: 429, headers: { "Retry-After": String(failure.retryAfter) } }
        );
      }
      return NextResponse.json(
        { error: "Desafío de seguridad incorrecto." },
        { status: 400 }
      );
    }

    // Desafío resuelto: limpiamos el contador de fallos de esta IP
    resetFailures(ip);
    
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
    logSecurityEvent("login_success", ip, "Sesión iniciada correctamente", undefined, 200);

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    logSecurityEvent(
      "login_error",
      getClientIp(request),
      `Fallo al iniciar sesión: ${message}`,
      undefined,
      401
    );
    return NextResponse.json({ error: message }, { status: 401 });
  }
}