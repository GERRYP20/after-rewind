/**
 * API Route: GET /api/admin/logs
 * Devuelve los logs de seguridad guardados en Firestore. Solo accesible
 * para usuarios cuyo correo esté en ADMIN_EMAILS.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/admin";
import { LogRepository } from "@/lib/logs/log.repository";
import { LogEventType } from "@/lib/logs/log.types";

const VALID_TYPES: LogEventType[] = [
  "rate_limit_exceeded",
  "login_blocked_attempts",
  "captcha_failed",
  "login_success",
  "login_error",
];

export async function GET(request: Request) {
  const user = await getServerUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const type = VALID_TYPES.includes(typeParam as LogEventType) ? (typeParam as LogEventType) : undefined;
  const limitParam = Number(searchParams.get("limit"));
  const limitCount = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100;

  try {
    const logs = await LogRepository.list({ limitCount, type });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error al obtener logs de seguridad:", error);
    return NextResponse.json({ error: "Error al obtener logs" }, { status: 500 });
  }
}
