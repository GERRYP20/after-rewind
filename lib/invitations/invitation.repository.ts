// Importamos la conexión a Firestore desde firebase-admin
import { db } from "../firebase-admin";

// Importamos los tipos necesarios de la librería oficial y tu interfaz personalizada
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Invitation } from "./invitation.types";

// Nombre de la colección en Firestore donde guardamos las invitaciones
const COLLECTION_NAME = "invitations";

/**
 * Función auxiliar para limpiar y formatear los datos que vienen de Firestore.
 * Incluye la lógica para manejar la URL de la imagen y convertir fechas.
 */
const mapInvitation = (doc: DocumentSnapshot | QueryDocumentSnapshot): Invitation => {
  const data = doc.data();
  
  if (!data) {
    throw new Error(`El documento con ID ${doc.id} no contiene datos.`);
  }

  return {
    id: doc.id,
    ...data,
    // La URL de la imagen vendrá de Cloudinary y se guardará como string en Firestore
    imageUrl: data.imageUrl || "", 
    // Convertimos los Timestamps a String ISO para evitar errores en el frontend
    date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as unknown as Invitation;
};

// Acá centramos todas las operaciones posibles con las invitaciones
export const InvitationRepository = {
  
  /**
   * Crea una nueva invitación de evento
   */
  async create(data: Omit<Invitation, "id">): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  /**
   * Recupera todos los eventos creados por un usuario
   */
  async getByUser(userId: string): Promise<Invitation[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("createdBy", "==", userId)
        .orderBy("date", "desc")
        .get();

      return snapshot.docs.map(mapInvitation);
    } catch (error) {
      console.error("Error en getByUser (posible falta de índice):", error);
      // Fallback si no hay índice para ordenar por fecha
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("createdBy", "==", userId)
        .get();
      
      const invitations = snapshot.docs.map(mapInvitation);
      return invitations.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
  },

  /**
   * Cuenta cuántos eventos tiene un usuario
   */
  async countByUser(userId: string): Promise<number> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("createdBy", "==", userId)
      .count()
      .get();

    return snapshot.data().count;
  },

  /**
   * Busca un evento por su código alfanumérico
   */
  async getByCode(code: string): Promise<Invitation | null> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("accessCode", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return mapInvitation(snapshot.docs[0]);
  },

  /**
   * Obtiene un evento por su ID de Firestore
   */
  async getById(id: string): Promise<Invitation | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    
    if (!doc.exists) return null;
    
    return mapInvitation(doc);
  },

  /**
   * Trae múltiples eventos por sus IDs
   */
  async getByIds(ids: string[]): Promise<Invitation[]> {
    if (ids.length === 0) return [];

    const snapshots = await db
      .collection(COLLECTION_NAME)
      .where("__name__", "in", ids)
      .get();

    return snapshots.docs.map(mapInvitation);
  },

  /**
   * Actualiza los datos de un evento
   */
  async update(id: string, data: Partial<Invitation>): Promise<void> {
    const updateData = { ...data };
    
    // Limpiamos campos protegidos que no deben sobreescribirse
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.accessCode;
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection(COLLECTION_NAME).doc(id).update(updateData);
  },

  /**
   * Borra un evento permanentemente
   */
  async delete(id: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(id).delete();
  },
};