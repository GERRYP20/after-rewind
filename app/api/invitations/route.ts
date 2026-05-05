import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { Invitation } from "@/lib/invitations/invitation.types";

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json([], { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId: string = decodedToken.uid;

    const invitations: Invitation[] = await InvitationRepository.getByUser(userId);
    return NextResponse.json(invitations);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error en GET /api/invitations:", errorMessage);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId: string = decodedToken.uid;

    // Tipamos el cuerpo de la petición omitiendo el ID que genera la DB
    const body = (await request.json()) as Omit<Invitation, "id" | "createdBy">;
    
    const newInvitation: Omit<Invitation, "id"> = {
      ...body,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    const id: string = await InvitationRepository.create(newInvitation);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error en POST /api/invitations:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}