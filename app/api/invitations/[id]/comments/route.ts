import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { CommentRepository } from "@/lib/comments/comment.repository";
import { Comment } from "@/lib/comments/comment.types";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    await adminAuth.verifySessionCookie(sessionCookie, false);
    const { id: eventId } = await params;

    const comments: Comment[] = await CommentRepository.getByEvent(eventId);
    return NextResponse.json(comments);
  } catch (error: unknown) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userName = decodedToken.name || decodedToken.displayName || "Usuario";
    const { id: eventId } = await params;

    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "El texto del comentario es requerido" }, { status: 400 });
    }

    const commentId = await CommentRepository.create({
      eventId,
      userName,
      text: text.trim(),
    });

    return NextResponse.json({ id: commentId, message: "Comentario creado" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Error al guardar el comentario" }, { status: 500 });
  }
}