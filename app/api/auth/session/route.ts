/**
 * API Route: GET /api/auth/session
 *
 * Indica si la cookie de sesión del servidor es válida. Firebase Auth
 * guarda su propio estado en el cliente (IndexedDB), que puede quedar
 * desincronizado de la cookie httpOnly que valida el servidor (ej. si el
 * login por Google resuelve en el cliente pero la petición que crea la
 * cookie en /api/sessionLogin nunca llega a completarse). La página de
 * login usa este endpoint para confirmar que hay sesión real antes de
 * redirigir, evitando el loop de redirecciones contra /dashboard.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";

export async function GET() {
  const user = await getServerUser();
  return NextResponse.json({ authenticated: Boolean(user) });
}
