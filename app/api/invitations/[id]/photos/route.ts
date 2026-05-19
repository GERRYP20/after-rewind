/**
 * API Route: /api/invitations/[id]/photos
 * Maneja la obtención de la galería y el registro de nuevas fotos subidas.
 */

import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";
import { EventPhotoRepository } from "@/lib/photos/event-photo.repository";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

// Auxiliar para verificar si el usuario tiene permiso para ver/subir fotos
async function verifyAccess(eventId: string, userId: string) {
  const event = await InvitationRepository.getById(eventId);
  if (!event) return { error: "Evento no encontrado", status: 404 };

  // Si es el dueño, tiene acceso total
  if (event.createdBy === userId) return { authorized: true, event, isOwner: true };

  // Si no es el dueño, verificamos si es un invitado confirmado
  const guestRecord = await EventGuestRepository.getByEventIdAndUserId(eventId, userId);
  if (guestRecord && guestRecord.status === "confirmed") {
    return { authorized: true, event, isOwner: false };
  }

  return { error: "No tienes permiso para acceder a esta galería", status: 403 };
}

/**
 * GET: Trae todas las fotos de un evento
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return NextResponse.json({ error: "No hay sesión" }, { status: 401 });

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;
    const { id: eventId } = await params;

    const access = await verifyAccess(eventId, userId);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const photos = await EventPhotoRepository.getByEventId(eventId);
    return NextResponse.json(photos);

  } catch (error: unknown) {
    console.error("Error al traer fotos:", error);
    return NextResponse.json({ error: "Error al obtener la galería" }, { status: 500 });
  }
}

/**
 * POST: Registra una nueva foto en Firestore (después de subirla a Cloudinary)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return NextResponse.json({ error: "No hay sesión" }, { status: 401 });

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;
    const userName = decodedToken.name || decodedToken.email?.split("@")[0] || "Invitado";
    
    const { id: eventId } = await params;

    const access = await verifyAccess(eventId, userId);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await request.json();
    const { url } = body;

    if (!url) return NextResponse.json({ error: "La URL de la foto es obligatoria" }, { status: 400 });

    const photoId = await EventPhotoRepository.create({
      eventId,
      userId,
      userName,
      url
    });

    return NextResponse.json({ id: photoId, message: "Foto guardada con éxito" }, { status: 201 });

  } catch (error: unknown) {
    console.error("Error al guardar foto:", error);
    return NextResponse.json({ error: "Error al registrar la foto" }, { status: 500 });
  }
}
