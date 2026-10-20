/**
 * API Route: GET /api/captcha/status
 *
 * Informa al cliente si el visitante ya resolvió el captcha de entrada.
 * La cookie es httpOnly, por lo que el navegador no puede leerla
 * directamente; este endpoint hace de puente.
 */
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getClientIp, verifyCaptchaPassCookie } from "@/lib/captcha";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.CAPTCHA_COOKIE_NAME || "captcha_pass";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resource = "/api/captcha/status";
  const ip = getClientIp(request);

  const rl = rateLimit(ip, resource, RATE_LIMITS[resource]);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;

  // Método 5: verificamos firma HMAC y expiración de la cookie.
  // Un valor fabricado (ej. "1") o manipulado ya no pasa como válido.
  const passed = verifyCaptchaPassCookie(cookieValue);

  // Si la cookie es inválida o vencida, la borramos para limpiar el estado
  if (!passed && cookieValue) {
    cookieStore.delete(COOKIE_NAME);
  }

  return NextResponse.json(
    { passed },
    { headers: { "Cache-Control": "no-store" } }
  );
}
