import { NextResponse } from "next/server";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params es ahora una promesa
) {
  try {
    const { id } = await params;
    const invitation = await InvitationRepository.getById(id);
    
    if (!invitation) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(invitation);
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}