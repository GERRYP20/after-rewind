import { db } from "../firebase-admin";
import { Invitation } from "./invitation.types";

const COLLECTION_NAME = "invitations";

export const InvitationRepository = {
  /**
   * Crea una nueva invitación en Firestore.
   * Usamos Omit para indicar que el 'id' no es necesario al crear.
   */
  async create(data: Omit<Invitation, "id">): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(), // Firebase Admin lo guardará como Timestamp
    });
    return docRef.id;
  },

  /**
   * Obtiene las invitaciones de un usuario específico.
   */
  async getByUser(userId: string): Promise<Invitation[]> {
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("createdBy", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
      
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convertimos el Timestamp a String ISO para que sea serializable en Next.js
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      } as unknown as Invitation;
    });
  },

  /**
   * Busca una invitación por su código de acceso único.
   */
  async getByCode(code: string): Promise<Invitation | null> {
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("accessCode", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    } as unknown as Invitation;
  }
};