import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";

// Obtener solo las invitaciones del usuario logueado
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json([], { status: 401 });
    }

    // Verificamos quién es el usuario mediante su cookie
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const invitations = await InvitationRepository.getByUser(userId);
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error al obtener invitaciones:", error);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

// Crear una invitación vinculada al usuario actual
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const body = await request.json();
    
    // Guardamos incluyendo el ID del creador
    const id = await InvitationRepository.create({
      ...body,
      createdBy: userId, // Vínculo crítico para la privacidad[cite: 1]
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("Error al crear invitación:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}