/**
 * Repository para gestionar los invitados de eventos en Firestore
 * Maneja todas las operaciones CRUD y transacciones para mantener la integridad
 */

import { db } from "../firebase-admin";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { EventGuest, CreateEventGuestData } from "./event-guest.types";

// Nombre de la colección en Firestore donde se almacenan los invitados
const COLLECTION_NAME = "event_guests";

/**
 * Función auxiliar para convertir un documento de Firestore a un objeto EventGuest
 * Mapea todos los campos del documento
 */
const mapEventGuest = (doc: DocumentSnapshot | QueryDocumentSnapshot): EventGuest => {
  const data = doc.data();

  if (!data) {
    throw new Error(`El documento con ID ${doc.id} no contiene datos.`);
  }

  return {
    id: doc.id,
    eventId: data.eventId,
    userId: data.userId,
    userName: data.userName,
    status: data.status,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as EventGuest;
};

/**
 * Repository de invitados que maneja todas las operaciones CRUD
 * en la colección de event_guests de Firestore
 */
export const EventGuestRepository = {
  /**
   * Crea un nuevo invitado en la base de datos
   * @param data - Datos del invitado sin incluir el id
   * @returns El ID del documento creado
   */
  async create(data: CreateEventGuestData): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  /**
   * Obtiene todos los invitados de un evento específico
   * @param eventId - ID del evento
   * @returns Lista de invitados del evento
   */
  async getByEventId(eventId: string): Promise<EventGuest[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("eventId", "==", eventId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(mapEventGuest);
  },

  /**
   * Obtiene los invitados de un evento filtrados por estado
   * @param eventId - ID del evento
   * @param status - Estado por el cual filtrar ('pending' | 'confirmed')
   * @returns Lista de invitados con el estado especificado
   */
  async getByEventIdAndStatus(eventId: string, status: 'pending' | 'confirmed'): Promise<EventGuest[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("eventId", "==", eventId)
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(mapEventGuest);
  },

  /**
   * Verifica si un usuario ya está registrado como invitado en un evento
   * @param eventId - ID del evento
   * @param userId - ID del usuario
   * @returns El invitados si existe, null si no existe
   */
  async getByEventIdAndUserId(eventId: string, userId: string): Promise<EventGuest | null> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("eventId", "==", eventId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return mapEventGuest(snapshot.docs[0]);
  },

  /**
   * Obtiene un invitado específico por su ID
   * @param guestId - ID del invitado
   * @returns El invitados encontrado o null si no existe
   */
  async getById(guestId: string): Promise<EventGuest | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(guestId).get();
    if (!doc.exists) return null;
    return mapEventGuest(doc);
  },

  /**
   * Aprueba un invitado (cambia status a 'confirmed' e incrementa guestCount)
   * Usa una transacción para mantener la consistencia
   * @param guestId - ID del documento del invitado
   * @param eventId - ID del evento
   */
  async approveGuest(guestId: string, eventId: string): Promise<void> {
    await db.runTransaction(async (transaction) => {
      // 1. Actualizar el estado del invitado a 'confirmed'
      const guestRef = db.collection(COLLECTION_NAME).doc(guestId);
      const guestDoc = await guestRef.get();
      
      if (!guestDoc.exists) {
        throw new Error("El invitado no existe");
      }

      transaction.update(guestRef, { status: "confirmed" });

      // 2. Incrementar el guestCount del evento
      const eventRef = db.collection("invitations").doc(eventId);
      const eventDoc = await eventRef.get();
      
      if (!eventDoc.exists) {
        throw new Error("El evento no existe");
      }

      const currentCount = eventDoc.data()?.guestCount || 0;
      transaction.update(eventRef, { guestCount: currentCount + 1 });
    });
  },

  /**
   * Rechaza un invitado (elimina el documento del invitado)
   * No modifica el guestCount ya que nunca fue confirmado
   * @param guestId - ID del documento del invitado a eliminar
   */
  async rejectGuest(guestId: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(guestId).delete();
  },

  /**
   * Elimina un invitado y decrementa el guestCount
   * Usa transacción para mantener consistencia
   * @param guestId - ID del documento del invitado
   * @param eventId - ID del evento
   */
  async removeGuest(guestId: string, eventId: string): Promise<void> {
    await db.runTransaction(async (transaction) => {
      // 1. Verificar que el invitado existe y está confirmado
      const guestRef = db.collection(COLLECTION_NAME).doc(guestId);
      const guestDoc = await guestRef.get();
      
      if (!guestDoc.exists) {
        throw new Error("El invitado no existe");
      }

      const guestData = guestDoc.data();
      const wasConfirmed = guestData?.status === "confirmed";

      // 2. Eliminar el documento del invitado
      transaction.delete(guestRef);

      // 3. Si estaba confirmado, decrementar el guestCount
      if (wasConfirmed) {
        const eventRef = db.collection("invitations").doc(eventId);
        const eventDoc = await eventRef.get();
        
        if (eventDoc.exists) {
          const currentCount = eventDoc.data()?.guestCount || 0;
          transaction.update(eventRef, { guestCount: Math.max(0, currentCount - 1) });
        }
      }
    });
  },
};