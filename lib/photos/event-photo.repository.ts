/**
 * Repositorio para gestionar las fotos de los eventos en Firestore.
 * Aquí manejamos el guardado, la obtención y el borrado de los registros de imágenes.
 */

import { db } from "../firebase-admin";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { EventPhoto, CreateEventPhotoData } from "./event-photo.types";

const COLLECTION_NAME = "event_photos";

// Función ayudante para convertir los datos de Firestore a nuestro tipo de TypeScript
const mapEventPhoto = (doc: DocumentSnapshot | QueryDocumentSnapshot): EventPhoto => {
  const data = doc.data();
  if (!data) throw new Error("Documento vacío");

  return {
    id: doc.id,
    ...data,
    // Convertimos el Timestamp de Firebase a un string ISO para el frontend
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as EventPhoto;
};

export const EventPhotoRepository = {
  /**
   * Guarda un nuevo registro de foto
   */
  async create(data: CreateEventPhotoData): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  /**
   * Obtiene la galería de fotos de un evento, ordenadas por fecha
   */
  async getByEventId(eventId: string): Promise<EventPhoto[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("eventId", "==", eventId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map(mapEventPhoto);
    } catch (error) {
      console.error("Error en getByEventId de fotos (posible falta de índice):", error);
      // Fallback si falla el ordenamiento por falta de índice
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("eventId", "==", eventId)
        .get();
      
      const photos = snapshot.docs.map(mapEventPhoto);
      return photos.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
  },

  /**
   * Lista todas las fotos subidas por un usuario
   */
  async getByUserId(userId: string): Promise<EventPhoto[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("userId", "==", userId)
      .get();

    return snapshot.docs.map(mapEventPhoto);
  },

  /**
   * Elimina el registro de una foto
   */
  async delete(photoId: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(photoId).delete();
  },

  /**
   * Busca una foto específica por su ID
   */
  async getById(photoId: string): Promise<EventPhoto | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(photoId).get();
    if (!doc.exists) return null;
    return mapEventPhoto(doc);
  }
};
