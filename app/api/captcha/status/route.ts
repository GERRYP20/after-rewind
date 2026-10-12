/**
 * API Route: GET /api/captcha/status
 *
 * Informa al cliente si el visitante ya resolvió el captcha de entrada.
 * La cookie es httpOnly, por lo que el navegador no puede leerla
 * directamente; este endpoint hace de puente.
 */
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/captcha";
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
  const passed = cookieStore.get(COOKIE_NAME)?.value === "1";

  return NextResponse.json(
    { passed },
    { headers: { "Cache-Control": "no-store" } }
  );
}
