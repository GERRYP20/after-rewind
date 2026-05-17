import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { CommentRepository } from "@/lib/comments/comment.repository";
import { Comment } from "@/lib/comments/comment.types";

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

    // Decodifica el token de sesión para obtener el ID del usuario actual
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    // DEBUG: Verificar el userId del usuario actual en sesión
    console.log("DEBUG - currentUserId de la sesión:", currentUserId);

    const { id: eventId } = await params;

    // Obtiene los comentarios del evento desde Firestore
    const comments: Comment[] = await CommentRepository.getByEvent(eventId);

    // DEBUG: Verificar los comentarios trae userId desde Firestore
    console.log("DEBUG - Comentarios obtenidos de Firestore:", JSON.stringify(comments));

    // Agrega el campo isOwner a cada comentario comparando IDs de usuario
    const commentsWithOwner = comments.map((comment) => ({
      ...comment,
      // Compara el userId del comentario con el currentUserId de la sesión
      isOwner: comment.userId === currentUserId,
    }));

    // DEBUG: Verificar el resultado de isOwner para cada comentario
    console.log("DEBUG - Comments with isOwner:", JSON.stringify(commentsWithOwner));

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

    // Decodifica el token para obtener información del usuario
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid; // ID único del usuario desde Firebase Auth

    // DEBUG: Verificar que estamos extrayendo el uid correctamente
    console.log("DEBUG - userId extraído del token de sesión:", userId);

    const userName = decodedToken.name || decodedToken.displayName || "Usuario";
    const { id: eventId } = await params;

    // Obtiene el texto del comentario del body
    const body = await request.json();
    const { text } = body;

    // Validación: el texto es requerido
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "El texto del comentario es requerido" }, { status: 400 });
    }

    // Crear el payload explícitamente con userId para Firestore
    const commentPayload = {
      eventId: eventId,
      userId: userId,  // Explicitamente incluido el userId del usuario autenticado
      userName: userName,
      text: text.trim(),
    };

    console.log("DEBUG - Payload que se envía a Firestore:", JSON.stringify(commentPayload));

    // Crea el comentario incluyendo el userId en Firestore
    const commentId = await CommentRepository.create({
      eventId: commentPayload.eventId,
      userId: commentPayload.userId,
      userName: commentPayload.userName,
      text: commentPayload.text,
    });

    return NextResponse.json({ id: commentId, message: "Comentario creado" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Error al guardar el comentario" }, { status: 500 });
  }
}