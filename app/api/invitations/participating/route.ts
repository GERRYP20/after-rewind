import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { Invitation } from "@/lib/invitations/invitation.types";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * GET: Obtiene todas las invitaciones a las que el usuario ha sido invitado y aceptado.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 1. Verificar la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // 2. Obtener identidad del usuario desde el token verificado
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId: string = decodedToken.uid;

    // 3. Recuperar todos los registros donde el usuario figura como invitado confirmado
    const joinedEventRecords = await EventGuestRepository.getJoinedEventsByUserId(userId);
    
    // 4. Extraer solo los identificadores únicos de cada evento
    const eventIds = joinedEventRecords.map(record => record.eventId);

    // Si no participa en nada, retornamos una lista vacía de inmediato
    if (eventIds.length === 0) {
      return NextResponse.json([]);
    }

    // 5. Consultar los detalles completos (título, fecha, etc.) de todos esos eventos en Firestore
    const invitations: Invitation[] = await InvitationRepository.getByIds(eventIds);

    // 6. Retornar la colección de invitaciones al cliente
    return NextResponse.json(invitations);
  } catch (error: unknown) {
    console.error("Error fetching participating invitations:", error);
    return NextResponse.json({ error: "Error al obtener las invitaciones" }, { status: 500 });
  }
}