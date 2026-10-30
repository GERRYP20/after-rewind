import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { CommentRepository } from "@/lib/comments/comment.repository";
import { Comment } from "@/lib/comments/comment.types";
import { getClientIp } from "@/lib/captcha";
import { logSecurityEvent } from "@/lib/logger";

// Nombre de la cookie de sesión
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * GET: Obtiene todos los comentarios de un evento.
 * 
 * Verifica la sesión del usuario y retorna los comentarios con un campo
 * isOwner que indica si el usuario actual es el autor de cada comentario.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verifica la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // Decodifica el token para saber quién está consultando
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { id: eventId } = await params;

    // Obtiene los comentarios del evento desde Firestore
    const comments: Comment[] = await CommentRepository.getByEvent(eventId);

    // Identifica cuáles comentarios pertenecen al usuario actual (para permitir edición/borrado)
    const commentsWithOwner = comments.map((comment) => ({
      ...comment,
      // Compara el userId del comentario con el currentUserId de la sesión
      isOwner: comment.userId === currentUserId,
    }));

    return NextResponse.json(commentsWithOwner);
  } catch (error: unknown) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
  }
}

/**
 * POST: Crea un nuevo comentario en un evento.
 * 
 * Extrae el userId y userName del token de sesión y crea el comentario
 * asociado al evento especificado.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verifica la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // Obtiene la identidad del autor desde el token
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid; 

    // Obtener datos frescos desde Firebase Auth
    const userRecord = await adminAuth.getUser(userId);
    const userName = userRecord.displayName || decodedToken.name || userRecord.email?.split('@')[0] || "Usuario";
    const userPhoto = userRecord.photoURL || null;

    const { id: eventId } = await params;

    // Obtiene el contenido del comentario
    const body = await request.json();
    const { text } = body;

    // Validación básica de contenido
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "El texto del comentario es requerido" }, { status: 400 });
    }

    // Persistimos el comentario en la base de datos
    const commentId = await CommentRepository.create({
      eventId: eventId,
      userId: userId,
      userName: userName,
      userPhoto: userPhoto || undefined,
      text: text.trim(),
    });

    logSecurityEvent(
      "comment_created",
      getClientIp(request),
      `Comentario creado por ${userName} en evento ${eventId}`,
      { eventId, userId, commentId },
      201
    );

    return NextResponse.json({ id: commentId, message: "Comentario creado" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Error al guardar el comentario" }, { status: 500 });
  }
}