/**
 * API Route: GET /api/invitations/[id]/guests
 * API Route: PATCH /api/invitations/[id]/guests
 * 
 * Gestión de invitados de un evento:
 * - GET: Obtener todos los invitados (confirmed y pending)
 * - PATCH: Aprobar o rechazar un invitado (solo el creador del evento)
 */

import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";

// Nombre de la cookie de sesión
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * GET: Obtener todos los invitados de un evento
 * 
 * Devuelve dos listas:
 * - confirmed: invitados que ya están confirmados
 * - pending: invitados esperando aprobación (solo si el usuario es el creador)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id: eventId } = await params;

    // 3. Obtener el evento para verificar que existe
    const event = await InvitationRepository.getById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 4. Obtener los invitados confirmados
    const confirmedGuests = await EventGuestRepository.getByEventIdAndStatus(eventId, 'confirmed');

    // 5. Determinar si el usuario es el creador del evento
    const isOwner = event.createdBy === currentUserId;

    // 6. Si es el creador, obtener también los pendientes
    let pendingGuests: any[] = [];
    if (isOwner) {
      pendingGuests = await EventGuestRepository.getByEventIdAndStatus(eventId, 'pending');
    }

    return NextResponse.json({
      confirmed: confirmedGuests,
      pending: pendingGuests,
      isOwner,
      guestCount: event.guestCount || 0,
    });

  } catch (error: unknown) {
    console.error("Error al obtener invitados:", error);
    return NextResponse.json({ error: "Error al obtener invitados" }, { status: 500 });
  }
}

/**
 * PATCH: Aprobar o rechazar un invitado
 * 
 * Solo el creador del evento puede ejecutar esta acción.
 * 
 * Body esperado:
 * {
 *   guestDocId: string,    // ID del documento del invitado
 *   action: 'approve' | 'reject'
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id: eventId } = await params;

    // 3. Obtener el evento
    const event = await InvitationRepository.getById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 4. Verificar que el usuario actual es el creador del evento (autorización)
    if (event.createdBy !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para gestionar invitados" }, { status: 403 });
    }

    // 5. Obtener los datos del body
    const body = await request.json();
    const { guestDocId, action } = body;

    if (!guestDocId || !action) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 6. Verificar que el invitado existe y pertenece a este evento
    const guest = await EventGuestRepository.getById(guestDocId);

    if (!guest) {
      return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    }

    if (guest.eventId !== eventId) {
      return NextResponse.json({ error: "El invitado no pertenece a este evento" }, { status: 400 });
    }

    // 7. Ejecutar la acción correspondiente
    if (action === 'approve') {
      // Aprobar: cambiar status a 'confirmed' e incrementar guestCount
      await EventGuestRepository.approveGuest(guestDocId, eventId);
      
      return NextResponse.json({
        success: true,
        message: "Invitado aprobado correctamente",
      });
    } else if (action === 'reject') {
      // Rechazar: eliminar el documento del invitado
      await EventGuestRepository.rejectGuest(guestDocId);
      
      return NextResponse.json({
        success: true,
        message: "Invitado rechazado correctamente",
      });
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error("Error al gestionar invitado:", error);
    return NextResponse.json({ error: "Error al gestionar el invitado" }, { status: 500 });
  }
}