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
    userPhoto: data.userPhoto || null,
    status: data.status,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as EventGuest;
};

/**
 * Repositorio para gestionar los invitados de eventos
 */
export const EventGuestRepository = {
  /**
   * Registra un nuevo invitado
   */
  async create(data: CreateEventGuestData): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  /**
   * Obtiene todos los invitados de un evento
   */
  async getByEventId(eventId: string): Promise<EventGuest[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("eventId", "==", eventId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map(mapEventGuest);
    } catch (error) {
      console.error("Error en getByEventId (posible falta de índice):", error);
      // Fallback si el índice de Firestore no está listo
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("eventId", "==", eventId)
        .get();
      
      const guests = snapshot.docs.map(mapEventGuest);
      return guests.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
  },

  /**
   * Trae los registros de invitado de un usuario
   */
  async getByUserId(userId: string): Promise<EventGuest[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("userId", "==", userId)
      .get();

    return snapshot.docs.map(mapEventGuest);
  },

  /**
   * Filtra invitados por estado (pendiente o confirmado)
   */
  async getByEventIdAndStatus(eventId: string, status: 'pending' | 'confirmed'): Promise<EventGuest[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("eventId", "==", eventId)
      .where("status", "==", status)
      .get();

    const guests = snapshot.docs.map(mapEventGuest);
    
    // Ordenamos en memoria para no depender de índices compuestos inmediatos
    return guests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  },

  /**
   * Verifica si un usuario ya solicitó unirse a un evento
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
   * Busca un invitado por ID
   */
  async getById(guestId: string): Promise<EventGuest | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(guestId).get();
    if (!doc.exists) return null;
    return mapEventGuest(doc);
  },

  /**
   * Aprueba la solicitud y actualiza el contador del evento (transaccional)
   */
  async approveGuest(guestId: string, eventId: string): Promise<void> {
    await db.runTransaction(async (transaction) => {
      const guestRef = db.collection(COLLECTION_NAME).doc(guestId);
      const guestDoc = await guestRef.get();
      
      if (!guestDoc.exists) {
        throw new Error("El invitado no existe");
      }

      // Cambiamos el estado a confirmado
      transaction.update(guestRef, { status: "confirmed" });

      const eventRef = db.collection("invitations").doc(eventId);
      const eventDoc = await eventRef.get();
      
      if (!eventDoc.exists) {
        throw new Error("El evento no existe");
      }

      // Incrementamos el total de invitados en el evento
      const currentCount = eventDoc.data()?.guestCount || 0;
      transaction.update(eventRef, { guestCount: currentCount + 1 });
    });
  },

  /**
   * Rechaza una solicitud eliminando el registro
   */
  async rejectGuest(guestId: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(guestId).delete();
  },

  /**
   * Elimina a un invitado y ajusta el contador si ya estaba confirmado
   */
  async removeGuest(guestId: string, eventId: string): Promise<void> {
    await db.runTransaction(async (transaction) => {
      const guestRef = db.collection(COLLECTION_NAME).doc(guestId);
      const guestDoc = await guestRef.get();
      
      if (!guestDoc.exists) {
        throw new Error("El invitado no existe");
      }

      const guestData = guestDoc.data();
      const wasConfirmed = guestData?.status === "confirmed";

      // Borramos el registro del invitado
      transaction.delete(guestRef);

      // Si estaba confirmado, restamos uno al contador del evento
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

  /**
   * Lista eventos donde el usuario ya fue aceptado
   */
  async getJoinedEventsByUserId(userId: string): Promise<EventGuest[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("userId", "==", userId)
      .where("status", "==", "confirmed")
      .get();

    return snapshot.docs.map(mapEventGuest);
  },
};