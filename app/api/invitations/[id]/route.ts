import { NextResponse } from "next/server";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = (await params).id;
    const invitation = await InvitationRepository.getById(id);
    
    if (!invitation) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(invitation);
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}