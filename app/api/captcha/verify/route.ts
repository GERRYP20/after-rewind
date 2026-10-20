/**
 * API Route: POST /api/captcha/verify
 *
 * Valida el desafío de "slider puzzle" del gate de entrada y, si es
 * correcto, setea una cookie httpOnly que marca al visitante como
 * verificado. La cookie es la que luego consulta /api/captcha/status.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createCaptchaPassCookie,
  getClientIp,
  isBlocked,
  registerFailure,
  resetFailures,
  verifySlider,
} from "@/lib/captcha";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.CAPTCHA_COOKIE_NAME || "captcha_pass";
const COOKIE_MAX_AGE = Number(process.env.CAPTCHA_COOKIE_MAX_AGE) || 60 * 60 * 12;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { captchaToken, captchaOffsetX, captchaOffsetY } = await request.json();

    const ip = getClientIp(request);

    // 0. Rate limiting general: protege el endpoint de fuerza bruta
    const resource = "/api/captcha/verify";
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

    // 2. Validamos el desafío visual
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

    // 3. Marcamos al visitante como verificado mediante cookie httpOnly
    // firmada con HMAC (Método 5: integridad criptográfica). Un valor
    // fabricado como "1" ya no pasa la verificación en /status.
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, createCaptchaPassCookie(COOKIE_MAX_AGE), {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
