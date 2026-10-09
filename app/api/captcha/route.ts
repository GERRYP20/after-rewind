/**
 * API Route: GET /api/captcha
 *
 * Emite un nuevo reto de "slider puzzle" firmado con HMAC.
 * El cliente recibe las posiciones para dibujar el puzzle, pero
 * la validación real ocurre en el servidor (sessionLogin).
 */
import { NextResponse } from "next/server";
import { createSliderChallenge } from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const challenge = createSliderChallenge();
    return NextResponse.json(challenge, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
