/**
 * API Route: GET /api/user/stats
 * Obtiene estadísticas reales de actividad del usuario para su perfil.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
    }

    // 1. Verificar la sesión y obtener el ID del usuario
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;

    // 2. Obtener datos de Firebase Auth para la fecha de creación
    const userRecord = await adminAuth.getUser(userId);
    const creationDate = new Date(userRecord.metadata.creationTime);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - creationDate.getTime());
    const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 3. Obtener conteo de eventos totales
    const totalEvents = await InvitationRepository.countByUser(userId);

    // 4. Obtener eventos próximos (fecha >= hoy)
    const allUserEvents = await InvitationRepository.getByUser(userId);
    const upcomingEvents = allUserEvents.filter(event => {
      const eventDate = new Date(event.date);
      // Normalizar a inicio del día para la comparación
      const compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return eventDate >= compareDate;
    }).length;

    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      daysActive: daysActive || 1, // Al menos 1 día si acaba de crearse
    });

  } catch (error: unknown) {
    console.error("Error al obtener estadísticas del usuario:", error);
    return NextResponse.json({ 
      error: "Error al cargar estadísticas" 
    }, { status: 500 });
  }
}
