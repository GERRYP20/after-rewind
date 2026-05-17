import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";

// Nombre de la cookie de sesión
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * GET: Obtiene una invitación por su ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invitation = await InvitationRepository.getById(id);
    
    if (!invitation) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(invitation);
  } catch (error: unknown) {
    console.error("Error en GET /invitations/[id]:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

/**
 * PUT: Actualiza una invitación existente
 * Verifica que el usuario actual sea el creador de la invitación
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // 2. Decodificar el token para obtener el ID del usuario actual
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { id } = await params;

    // 3. Obtener la invitación actual de la base de datos
    const invitation = await InvitationRepository.getById(id);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // 4. Verificar que el usuario actual sea el creador (autorización)
    if (invitation.createdBy !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para editar esta invitación" }, { status: 403 });
    }

    // 5. Obtener los datos a actualizar del body
    const body = await request.json();

    // 6. Actualizar la invitación en la base de datos
    await InvitationRepository.update(id, body);

    return NextResponse.json({ message: "Invitación actualizada correctamente" });
  } catch (error: unknown) {
    console.error("Error en PUT /invitations/[id]:", error);
    return NextResponse.json({ error: "Error al actualizar la invitación" }, { status: 500 });
  }
}

/**
 * DELETE: Elimina una invitación existente
 * Verifica que el usuario actual sea el creador de la invitación
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // 2. Decodificar el token para obtener el ID del usuario actual
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { id } = await params;

    // 3. Obtener la invitación actual de la base de datos
    const invitation = await InvitationRepository.getById(id);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // 4. Verificar que el usuario actual sea el creador (autorización)
    if (invitation.createdBy !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta invitación" }, { status: 403 });
    }

    // 5. Eliminar la invitación de la base de datos
    await InvitationRepository.delete(id);

    return NextResponse.json({ message: "Invitación eliminada correctamente" });
  } catch (error: unknown) {
    console.error("Error en DELETE /invitations/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar la invitación" }, { status: 500 });
  }
}