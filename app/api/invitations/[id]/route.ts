import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { EventPhotoRepository } from "@/lib/photos/event-photo.repository";
import { CommentRepository } from "@/lib/comments/comment.repository";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";
import { deleteFromCloudinary } from "@/lib/cloudinary-utils";

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
    // Busca la invitación por ID en la base de datos
    const invitation = await InvitationRepository.getById(id);
    
    if (!invitation) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // ─── UNIÓN DE DATOS: Obtener info del anfitrión desde Firebase Auth ──────────
    try {
      // Intentamos enriquecer la invitación con los datos del perfil del creador
      const hostRecord = await adminAuth.getUser(invitation.createdBy);
      invitation.hostName = hostRecord.displayName || hostRecord.email?.split('@')[0] || "Anfitrión";
      invitation.hostPhoto = hostRecord.photoURL || null;
    } catch (e) {
      console.error(`No se pudo obtener info del anfitrión ${invitation.createdBy}:`, e);
      invitation.hostName = "Anfitrión";
    }
    // ──────────────────────────────────────────────────────────────────────────
    
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

    // 3. Obtener la invitación actual de la base de datos para validar autoría
    const invitation = await InvitationRepository.getById(id);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // 4. Verificar que el usuario actual sea el dueño del evento
    if (invitation.createdBy !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para editar esta invitación" }, { status: 403 });
    }

    // 5. Obtener los nuevos datos del cuerpo de la petición
    const body = await request.json();

    // 6. Aplicar la actualización en Firestore
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

    // 3. Obtener la invitación actual
    const invitation = await InvitationRepository.getById(id);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // 4. Solo el creador original puede borrar el evento
    if (invitation.createdBy !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta invitación" }, { status: 403 });
    }

    // ─── BORRADO EN CASCADA: Limpiar datos asociados ────────────────────────
    try {
      console.log(`Iniciando limpieza total para el evento ${id}`);

      // 1. Limpiar fotos (Cloudinary + Firestore) para no dejar archivos huérfanos
      const photos = await EventPhotoRepository.getByEventId(id).catch(() => []);
      for (const photo of photos) {
        if (photo.url) await deleteFromCloudinary(photo.url).catch(() => {});
        if (photo.id) await EventPhotoRepository.delete(photo.id).catch(() => {});
      }

      // 2. Limpiar todos los comentarios del muro del evento
      const comments = await CommentRepository.getByEvent(id).catch(() => []);
      for (const comment of comments) {
        if (comment.id) await CommentRepository.delete(comment.id).catch(() => {});
      }

      // 3. Eliminar los registros de asistencia de los invitados
      const guests = await EventGuestRepository.getByEventId(id).catch(() => []);
      for (const guest of guests) {
        // rejectGuest simplemente borra el documento sin afectar otros contadores
        if (guest.id) await EventGuestRepository.rejectGuest(guest.id).catch(() => {});
      }
      
    } catch (e) {
      console.error("Error en limpieza en cascada durante borrado de invitación:", e);
    }
    // ──────────────────────────────────────────────────────────────────────────

    // 5. Finalmente eliminar el documento de la invitación
    await InvitationRepository.delete(id);

    return NextResponse.json({ message: "Invitación eliminada correctamente" });
  } catch (error: unknown) {
    console.error("Error en DELETE /invitations/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar la invitación" }, { status: 500 });
  }
}