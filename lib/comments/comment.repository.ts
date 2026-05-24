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
    userPhoto: data.userPhoto || null,
    text: data.text,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as Comment;
};

/**
 * Repositorio para manejar la persistencia de comentarios en Firestore
 */
export const CommentRepository = {
  /**
   * Guarda un comentario nuevo
   */
  async create(data: Omit<Comment, "id" | "isOwner">): Promise<string> {
    // Registramos la creación en los logs para debugging
    console.log("DEBUG - Repository create receives data:", JSON.stringify(data));
    
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    
    return docRef.id;
  },

  /**
   * Obtiene los comentarios de un evento, con fallback si falla el índice
   */
  async getByEvent(eventId: string): Promise<Comment[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("eventId", "==", eventId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map(mapComment);
    } catch (error) {
      console.error("Error en getByEvent de comentarios (posible falta de índice):", error);
      // Si el índice no está listo, traemos todo y ordenamos en memoria
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("eventId", "==", eventId)
        .get();
      
      const comments = snapshot.docs.map(mapComment);
      return comments.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
  },

  /**
   * Recupera comentarios por autor
   */
  async getByUserId(userId: string): Promise<Comment[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("userId", "==", userId)
      .get();

    return snapshot.docs.map(mapComment);
  },

  /**
   * Busca un comentario por su ID único
   */
  async getById(commentId: string): Promise<Comment | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(commentId).get();
    if (!doc.exists) return null;
    return mapComment(doc);
  },

  /**
   * Modifica el contenido de un comentario
   */
  async update(commentId: string, text: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(commentId).update({
      text,
      updatedAt: new Date(),
    });
  },

  /**
   * Elimina un comentario permanentemente
   */
  async delete(commentId: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(commentId).delete();
  },
};