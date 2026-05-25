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
import { adminAuth, db } from "@/lib/firebase-admin";
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

    // 2. Obtener identidad del usuario desde el token
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;

    // Obtenemos el perfil actualizado del usuario desde Firebase
    const userRecord = await adminAuth.getUser(userId);
    const userName = userRecord.displayName || decodedToken.name || userRecord.email?.split('@')[0] || "Usuario";
    const userPhoto = userRecord.photoURL || null;

    const { code } = await params;

    // 3. Intentar localizar el evento usando el código de acceso proporcionado
    const event = await InvitationRepository.getByCode(code);

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 4. Revisar si el usuario ya está registrado en este evento para evitar duplicados
    const existingGuest = await EventGuestRepository.getByEventIdAndUserId(event.id!, userId);

    if (existingGuest) {
      // Si ya existe el registro, informamos al usuario de su estado actual
      return NextResponse.json({
        success: true,
        message: "Ya eres invitado de este evento",
        status: existingGuest.status,
        eventId: event.id,
        alreadyJoined: true,
      });
    }

    // 5. Verificamos si el evento es de acceso libre o requiere aprobación previa
    const visibility = event.visibility || 'public';

    // 6. Procesamos la entrada según el tipo de visibilidad
    if (visibility === 'public') {
      // En eventos públicos, el acceso es inmediato
      
      // Se usa una transacción para asegurar la consistencia del contador de invitados
      await createConfirmedGuestWithTransaction(event.id!, userId, userName, userPhoto);
      
      return NextResponse.json({
        success: true,
        message: "Te has unido al evento correctamente",
        status: 'confirmed',
        eventId: event.id,
      });
    } else {
      // En eventos privados, se crea una solicitud que el anfitrión debe aprobar
      
      await EventGuestRepository.create({
        eventId: event.id!,
        userId,
        userName,
        userPhoto: userPhoto || null, // Aseguramos que sea null y no undefined
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Solicitud enviada. El creador del evento debe aprobarte.",
        status: 'pending',
        eventId: event.id,
      });
    }

  } catch (error: unknown) {
    console.error("Error al unirse al evento:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `Error al unirse al evento: ${message}` }, { status: 500 });
  }
}

/**
 * Función auxiliar para crear un invitado confirmado con transacción
 * Crea el documento en event_guests E incrementa guestCount atómicamente
 */
async function createConfirmedGuestWithTransaction(
  eventId: string,
  userId: string,
  userName: string,
  userPhoto: string | null
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    // 1. Obtener el evento primero (LECTURA)
    const eventRef = db.collection("invitations").doc(eventId);
    const eventDoc = await transaction.get(eventRef);
    
    if (!eventDoc.exists) {
      throw new Error("El evento no existe");
    }

    // 2. Crear el documento del invitado (ESCRITURA)
    const guestRef = db.collection("event_guests").doc();
    transaction.set(guestRef, {
      eventId,
      userId,
      userName,
      userPhoto: userPhoto || null,
      status: 'confirmed',
      createdAt: new Date(),
    });

    // 3. Incrementar el guestCount del evento (ESCRITURA)
    const currentCount = eventDoc.data()?.guestCount || 0;
    transaction.update(eventRef, { guestCount: currentCount + 1 });
  });
}
