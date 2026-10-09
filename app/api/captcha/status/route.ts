/**
 * API Route: GET /api/captcha/status
 *
 * Informa al cliente si el visitante ya resolvió el captcha de entrada.
 * La cookie es httpOnly, por lo que el navegador no puede leerla
 * directamente; este endpoint hace de puente.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.CAPTCHA_COOKIE_NAME || "captcha_pass";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const passed = cookieStore.get(COOKIE_NAME)?.value === "1";

  return NextResponse.json(
    { passed },
    { headers: { "Cache-Control": "no-store" } }
  );
}
