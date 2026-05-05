import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { Invitation } from "@/lib/invitations/invitation.types";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    console.log("Looking for cookie:", COOKIE_NAME, "Found:", !!sessionCookie);

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId: string = decodedToken.uid;

    console.log("Fetching invitations for userId:", userId);

    const invitations: Invitation[] = await InvitationRepository.getByUser(userId);
    return NextResponse.json(invitations);
  } catch (error: unknown) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Error al obtener invitaciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId: string = decodedToken.uid;

    console.log("Creating invitation for userId:", userId);

    const body = await request.json();
    const { title, date, location, accessCode } = body;

    if (!title || !date || !location || !accessCode) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const invitationId = await InvitationRepository.create({
      title,
      date,
      location,
      accessCode,
      createdBy: userId,
    });

    return NextResponse.json({ id: invitationId, message: "Invitación creada" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al crear invitación:", error);
    return NextResponse.json({ error: "Error al guardar la invitación" }, { status: 500 });
  }
}