import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { CommentRepository } from "@/lib/comments/comment.repository";

// Nombre de la cookie de sesión
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * PATCH: Actualiza el texto de un comentario existente.
 * 
 * Verifica que el usuario actual sea el autor del comentario antes de actualizar.
 * Retorna 403 si el usuario no es el propietario.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
): Promise<NextResponse> {
  try {
    // Verifica la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // Decodifica el token para obtener el ID del usuario actual
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { commentId } = await params;

    // Obtiene el comentario de la base de datos
    const comment = await CommentRepository.getById(commentId);

    // Verifica que el comentario exista
    if (!comment) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    // Verifica que el usuario actual sea el autor del comentario (seguridad server-side)
    if (comment.userId !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para editar este comentario" }, { status: 403 });
    }

    // Obtiene el nuevo texto del body
    const body = await request.json();
    const { text } = body;

    // Validación: el texto es requerido
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "El texto del comentario es requerido" }, { status: 400 });
    }

    // Actualiza el comentario en la base de datos
    await CommentRepository.update(commentId, text.trim());

    return NextResponse.json({ message: "Comentario actualizado" });
  } catch (error: unknown) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Error al actualizar el comentario" }, { status: 500 });
  }
}

/**
 * DELETE: Elimina un comentario existente.
 * 
 * Verifica que el usuario actual sea el autor del comentario antes de eliminar.
 * Retorna 403 si el usuario no es el propietario.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
): Promise<NextResponse> {
  try {
    // Verifica la sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // Decodifica el token para obtener el ID del usuario actual
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { commentId } = await params;

    // Obtiene el comentario de la base de datos
    const comment = await CommentRepository.getById(commentId);

    // Verifica que el comentario exista
    if (!comment) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    // Verifica que el usuario actual sea el autor del comentario (seguridad server-side)
    if (comment.userId !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este comentario" }, { status: 403 });
    }

    // Elimina el comentario de la base de datos
    await CommentRepository.delete(commentId);

    return NextResponse.json({ message: "Comentario eliminado" });
  } catch (error: unknown) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Error al eliminar el comentario" }, { status: 500 });
  }
}