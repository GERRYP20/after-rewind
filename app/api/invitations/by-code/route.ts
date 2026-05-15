import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";

// Nombre de la cookie de sesión
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * GET: Busca un evento por su código de acceso.
 * 
 * Parámetros de URL:
 *   - code: El código de acceso del evento a buscar (query string)
 * 
 * Retorna:
 *   - 200: Datos del evento encontrado
 *   - 401: Usuario no autenticado
 *   - 404: Código no encontrado
 *   - 500: Error del servidor
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verifica que el usuario tenga una sesión activa
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // Verifica la cookie de sesión
    await adminAuth.verifySessionCookie(sessionCookie, false);

    // Obtiene el código de los parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // Validación: el código es requerido
    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: "El código es requerido" }, { status: 400 });
    }

    // Busca el evento en la base de datos usando el repositorio
    const invitation = await InvitationRepository.getByCode(code.trim().toUpperCase());

    // Si no se encuentra el evento, retorna 404
    if (!invitation) {
      return NextResponse.json({ error: "Código no encontrado" }, { status: 404 });
    }

    // Retorna los datos del evento encontrado
    return NextResponse.json(invitation);
  } catch (error: unknown) {
    console.error("Error buscando invitación por código:", error);
    return NextResponse.json({ error: "Error al buscar la invitación" }, { status: 500 });
  }
}