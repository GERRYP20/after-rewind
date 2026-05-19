import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";
import { EventGuest } from "@/lib/guests/event-guest.types";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;
    const { id: eventId } = await params;
    const event = await InvitationRepository.getById(eventId);
    if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    const confirmedGuests = await EventGuestRepository.getByEventIdAndStatus(eventId, 'confirmed');
    const isOwner = event.createdBy === currentUserId;
    let pendingGuests: EventGuest[] = [];
    if (isOwner) pendingGuests = await EventGuestRepository.getByEventIdAndStatus(eventId, 'pending');
    return NextResponse.json({
      confirmed: confirmedGuests,
      pending: pendingGuests,
      isOwner,
      guestCount: event.guestCount || 0
    });
  } catch (error: unknown) {
    console.error("Error GET /guests:", error);
    return NextResponse.json({ error: "Error al obtener los invitados" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;
    const { id: eventId } = await params;
    const guestRecord = await EventGuestRepository.getByEventIdAndUserId(eventId, currentUserId);
    if (!guestRecord) return NextResponse.json({ error: "No eres invitado" }, { status: 404 });
    await EventGuestRepository.removeGuest(guestRecord.id!, eventId);
    return NextResponse.json({ message: "Has salido del evento" });
  } catch (error: unknown) {
    console.error("Error DELETE /guests:", error);
    return NextResponse.json({ error: "Error al salir del evento" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;
    const { id: eventId } = await params;
    const event = await InvitationRepository.getById(eventId);
    if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    if (event.createdBy !== currentUserId) return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
    const body = await request.json();
    const { guestDocId, action } = body;
    if (!guestDocId || !action) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    const guest = await EventGuestRepository.getById(guestDocId);
    if (!guest) return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    if (guest.eventId !== eventId) return NextResponse.json({ error: "No pertenece al evento" }, { status: 400 });
    if (action === 'approve') {
      await EventGuestRepository.approveGuest(guestDocId, eventId);
      return NextResponse.json({ success: true });
    } else if (action === 'reject') {
      await EventGuestRepository.rejectGuest(guestDocId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Error PATCH /guests:", error);
    return NextResponse.json({ error: "Error al gestionar invitado" }, { status: 500 });
  }
}