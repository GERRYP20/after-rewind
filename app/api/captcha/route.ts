/**
 * API Route: GET /api/captcha
 *
 * Emite un nuevo reto de "slider puzzle" firmado con HMAC.
 * El cliente recibe las posiciones para dibujar el puzzle, pero
 * la validación real ocurre en el servidor (sessionLogin).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSliderChallenge, getClientIp } from "@/lib/captcha";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const resource = "/api/captcha";
    const ip = getClientIp(request);

    const rl = rateLimit(ip, resource, RATE_LIMITS[resource]);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Espera un momento." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfter),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const challenge = createSliderChallenge();
    return NextResponse.json(challenge, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
