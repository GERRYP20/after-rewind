/**
 * API Route: /api/invitations/[id]/photos/[photoId]
 * Permite eliminar una foto de la galería.
 */

import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { EventPhotoRepository } from "@/lib/photos/event-photo.repository";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return NextResponse.json({ error: "No hay sesión" }, { status: 401 });

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;
    
    const { id: eventId, photoId } = await params;

    // 1. Obtener la información de la foto
    const photo = await EventPhotoRepository.getById(photoId);
    if (!photo) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    // 2. Obtener el evento para saber quién es el dueño
    const event = await InvitationRepository.getById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 3. Verificar permisos de eliminación:
    // - El usuario que subió la foto puede borrarla.
    // - El dueño del evento puede borrar cualquier foto.
    const isPhotoOwner = photo.userId === userId;
    const isEventOwner = event.createdBy === userId;

    if (!isPhotoOwner && !isEventOwner) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta foto" }, { status: 403 });
    }

    // 4. Eliminar el registro de Firestore
    await EventPhotoRepository.delete(photoId);

    // Nota: Por ahora solo borramos el registro en Firestore. 
    // Borrar la imagen física en Cloudinary requeriría guardar el public_id.
    
    return NextResponse.json({ message: "Foto eliminada correctamente" });

  } catch (error: unknown) {
    console.error("Error al eliminar foto:", error);
    return NextResponse.json({ error: "Error al intentar eliminar la foto" }, { status: 500 });
  }
}
