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

    // Identifica al usuario que intenta editar
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { commentId } = await params;

    // Busca el comentario original para validar la autoría
    const comment = await CommentRepository.getById(commentId);

    // Verifica que el comentario exista
    if (!comment) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    // Bloquea la edición si el usuario no es quien escribió el comentario
    if (comment.userId !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para editar este comentario" }, { status: 403 });
    }

    // Extrae el nuevo contenido del comentario
    const body = await request.json();
    const { text } = body;

    // El comentario no puede estar vacío
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "El texto del comentario es requerido" }, { status: 400 });
    }

    // Guarda los cambios en la base de datos
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
    // Validación de sesión inicial
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
    }

    // Obtiene el ID del usuario desde el token verificado
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const currentUserId = decodedToken.uid;

    const { commentId } = await params;

    // Recupera el comentario para verificar quién es el dueño
    const comment = await CommentRepository.getById(commentId);

    // Si no existe el comentario, no hay nada que borrar
    if (!comment) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    // Solo el autor tiene permitido borrar su propio comentario
    if (comment.userId !== currentUserId) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este comentario" }, { status: 403 });
    }

    // Ejecuta la eliminación en Firestore
    await CommentRepository.delete(commentId);

    return NextResponse.json({ message: "Comentario eliminado" });
  } catch (error: unknown) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Error al eliminar el comentario" }, { status: 500 });
  }
}