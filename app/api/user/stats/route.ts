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

    // 1. Identificar al usuario a través de su cookie de sesión
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;

    // 2. Calcular cuánto tiempo lleva el usuario registrado en la plataforma
    const userRecord = await adminAuth.getUser(userId);
    const creationDate = new Date(userRecord.metadata.creationTime);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - creationDate.getTime());
    const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 3. Contabilizar cuántas invitaciones ha creado el usuario en total
    const totalEvents = await InvitationRepository.countByUser(userId);

    // 4. Filtrar y contar solo aquellos eventos cuya fecha sea hoy o a futuro
    const allUserEvents = await InvitationRepository.getByUser(userId);
    const upcomingEvents = allUserEvents.filter(event => {
      const eventDate = new Date(event.date);
      // Comparamos contra el inicio del día de hoy
      const compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return eventDate >= compareDate;
    }).length;

    // Retornamos el consolidado de estadísticas para el perfil
    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      daysActive: daysActive || 1, // Mostramos al menos 1 día de actividad
    });

  } catch (error: unknown) {
    console.error("Error al obtener estadísticas del usuario:", error);
    return NextResponse.json({ 
      error: "Error al cargar estadísticas" 
    }, { status: 500 });
  }
}
