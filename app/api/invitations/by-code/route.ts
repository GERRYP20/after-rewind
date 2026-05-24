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
    // 1. Validar que el usuario tenga una sesión activa en el servidor
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // 2. Verificar la integridad de la cookie con Firebase Admin
    await adminAuth.verifySessionCookie(sessionCookie, false);

    // 3. Obtener el código enviado por el usuario desde los parámetros de la URL
    const { searchParams } = new URL(request.url);
    let code = searchParams.get("code")?.trim().toUpperCase() || "";

    // 4. El código es obligatorio para realizar la búsqueda
    if (!code) {
      return NextResponse.json({ error: "El código es requerido" }, { status: 400 });
    }

    // 5. Normalización del código: si el usuario olvidó el guión intermedio,
    // lo insertamos automáticamente para que coincida con el formato de la DB (XXXXX-XXXXX)
    if (code.length === 10 && !code.includes("-")) {
      code = `${code.substring(0, 5)}-${code.substring(5)}`;
    }

    // 6. Consultar en Firestore si existe un evento con este código exacto
    const invitation = await InvitationRepository.getByCode(code);

    // Si no hay resultados, informamos que el código no es válido
    if (!invitation) {
      return NextResponse.json({ error: "Código no encontrado" }, { status: 404 });
    }

    // 7. Retornar los detalles básicos del evento encontrado
    return NextResponse.json(invitation);
  } catch (error: unknown) {
    console.error("Error buscando invitación por código:", error);
    return NextResponse.json({ error: "Error al buscar la invitación" }, { status: 500 });
  }
}