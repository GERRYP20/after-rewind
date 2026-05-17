/**
 * API Route: POST /api/invitations/access/[code]
 * 
 * Permite a un usuario unirse a un evento usando el código de acceso.
 * 
 * Lógica:
 * - Si el evento es 'public': el usuario se une automáticamente como 'confirmed'
 * - Si el evento es 'private': el usuario se une como 'pending' y requiere aprobación
 * - Si el usuario ya es invitado, devuelve el estado actual sin duplicar
 */

import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";

// Nombre de la cookie de sesión
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * POST: Unirse a un evento usando el código de acceso
 * 
 * Proceso:
 * 1. Verificar que el usuario tenga sesión activa
 * 2. Obtener el evento por su código
 * 3. Verificar si el usuario ya es invitado (evitar duplicados)
 * 4. Según la visibilidad del evento:
 *    - Public: crear guest como 'confirmed' e incrementar guestCount
 *    - Private: crear guest como 'pending' (sin incrementar contador)
 * 5. Devolver el resultado con el estado del invitado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  try {
    // 1. Verificar la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // 2. Decodificar el token para obtener información del usuario
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;
    // Usar name o displayName del token, o fallback a "Usuario"
    const userName = decodedToken.name || decodedToken.displayName || "Usuario";

    const { code } = await params;

    // 3. Buscar el evento por su código de acceso
    const event = await InvitationRepository.getByCode(code);

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 4. Verificar si el usuario ya es un invitado de este evento (evitar duplicados)
    const existingGuest = await EventGuestRepository.getByEventIdAndUserId(event.id!, userId);

    if (existingGuest) {
      // El usuario ya está unido al evento - devolver su estado actual
      return NextResponse.json({
        success: true,
        message: "Ya eres invitado de este evento",
        status: existingGuest.status,
        eventId: event.id,
        alreadyJoined: true,
      });
    }

    // 5. Determinar la visibilidad del evento (default: public para eventos antiguos)
    const visibility = event.visibility || 'public';

    // 6. Según la visibilidad, crear el invitado con el estado apropiado
    if (visibility === 'public') {
      // Evento público: el usuario se une automáticamente como confirmado
      
      // Usar transacción para crear el guest e incrementar el contador atómicamente
      await createConfirmedGuestWithTransaction(event.id!, userId, userName);
      
      return NextResponse.json({
        success: true,
        message: "Te has unido al evento correctamente",
        status: 'confirmed',
        eventId: event.id,
      });
    } else {
      // Evento privado: el usuario se une como pendiente de aprobación
      
      await EventGuestRepository.create({
        eventId: event.id!,
        userId,
        userName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Solicitud enviada. El creador del evento debe aprobte.",
        status: 'pending',
        eventId: event.id,
      });
    }

  } catch (error: unknown) {
    console.error("Error al unirse al evento:", error);
    return NextResponse.json({ error: "Error al unirse al evento" }, { status: 500 });
  }
}

/**
 * Función auxiliar para crear un invitado confirmado con transacción
 * Crea el documento en event_guests E incrementa guestCount atómicamente
 */
async function createConfirmedGuestWithTransaction(
  eventId: string,
  userId: string,
  userName: string
): Promise<void> {
  const { db } = await import("@/lib/firebase-admin");
  
  await db.runTransaction(async (transaction) => {
    // 1. Crear el documento del invitado
    const guestRef = db.collection("event_guests").doc();
    transaction.set(guestRef, {
      eventId,
      userId,
      userName,
      status: 'confirmed',
      createdAt: new Date(),
    });

    // 2. Incrementar el guestCount del evento
    const eventRef = db.collection("invitations").doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (eventDoc.exists) {
      const currentCount = eventDoc.data()?.guestCount || 0;
      transaction.update(eventRef, { guestCount: currentCount + 1 });
    }
  });
}