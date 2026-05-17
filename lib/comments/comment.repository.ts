import { db } from "../firebase-admin";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Comment } from "./comment.types";

// Nombre de la colección en Firestore donde se almacenan los comentarios
const COLLECTION_NAME = "comments";

/**
 * Función auxiliar para convertir un documento de Firestore a un objeto Comment.
 * Convierte los timestamps a formato ISO y mapea todos los campos.
 */
const mapComment = (doc: DocumentSnapshot | QueryDocumentSnapshot): Comment => {
  const data = doc.data();

  if (!data) {
    throw new Error(`El documento con ID ${doc.id} no contiene datos.`);
  }

  return {
    id: doc.id,
    eventId: data.eventId,
    userId: data.userId,
    userName: data.userName,
    text: data.text,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as Comment;
};

/**
 * Repositorio de comentarios que maneja todas las operaciones CRUD
 * en la colección de comentarios de Firestore.
 */
export const CommentRepository = {
  /**
   * Crea un nuevo comentario en la base de datos.
   * @param data - Datos del comentario sin incluir el id
   * @returns El ID del documento creado
   */
  async create(data: Omit<Comment, "id" | "isOwner">): Promise<string> {
    // DEBUG: Verificar que data incluye userId antes de guardar en Firestore
    console.log("DEBUG - Repository create receives data:", JSON.stringify(data));
    
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    
    console.log("DEBUG - Document created with ID:", docRef.id);
    return docRef.id;
  },

  /**
   * Obtiene todos los comentarios de un evento específico.
   * @param eventId - ID del evento
   * @returns Lista de comentarios ordenados por fecha (más recientes primero)
   */
  async getByEvent(eventId: string): Promise<Comment[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("eventId", "==", eventId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(mapComment);
  },

  /**
   * Obtiene un comentario específico por su ID.
   * @param commentId - ID del comentario
   * @returns El comentario encontrado o null si no existe
   */
  async getById(commentId: string): Promise<Comment | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(commentId).get();
    if (!doc.exists) return null;
    return mapComment(doc);
  },

  /**
   * Actualiza el texto de un comentario existente.
   * @param commentId - ID del comentario a actualizar
   * @param text - Nuevo texto del comentario
   */
  async update(commentId: string, text: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(commentId).update({
      text,
      updatedAt: new Date(), // Agrega marca de tiempo de actualización
    });
  },

  /**
   * Elimina un comentario de la base de datos.
   * @param commentId - ID del comentario a eliminar
   */
  async delete(commentId: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(commentId).delete();
  },
};