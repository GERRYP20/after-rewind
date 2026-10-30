/**
 * API Route: GET /api/admin/check
 * Indica si el usuario autenticado actual es administrador, para que
 * el header pueda mostrar u ocultar el enlace al panel de admin sin
 * exponer la lista de correos (ADMIN_EMAILS) al cliente.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/admin";

export async function GET() {
  const user = await getServerUser();
  return NextResponse.json({ isAdmin: isAdminEmail(user?.email) });
}
