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
  
  // Método para guardar una nueva invitación
  // Ahora el objeto 'data' debe incluir la propiedad 'imageUrl'
  async create(data: Omit<Invitation, "id">): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(), // Firestore lo guarda como Timestamp
    });
    return docRef.id;
  },

  // Método para traer todas las invitaciones de un usuario
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
      // Fallback: traer sin ordenar si falla el índice
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("createdBy", "==", userId)
        .get();
      
      const invitations = snapshot.docs.map(mapInvitation);
      // Ordenar manualmente en memoria como plan B
      return invitations.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
  },

  /**
   * Cuenta cuántos eventos ha creado un usuario
   * @param userId - ID del usuario
   * @returns Número de eventos
   */
  async countByUser(userId: string): Promise<number> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("createdBy", "==", userId)
      .count()
      .get();

    return snapshot.data().count;
  },

  // Método para obtener una invitación por su código de acceso único
  async getByCode(code: string): Promise<Invitation | null> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("accessCode", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return mapInvitation(snapshot.docs[0]);
  },

  // Método para obtener una invitación por su ID (usado en la página de detalles)
  async getById(id: string): Promise<Invitation | null> {
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    
    if (!doc.exists) return null;
    
    return mapInvitation(doc);
  },

  // Método para obtener varias invitaciones por sus IDs
  async getByIds(ids: string[]): Promise<Invitation[]> {
    if (ids.length === 0) return [];

    // Firestore limit: 'in' queries can have up to 30 values
    // If we have more, we would need to chunk them, but for now we'll assume a reasonable number
    const snapshots = await db
      .collection(COLLECTION_NAME)
      .where("__name__", "in", ids)
      .get();

    return snapshots.docs.map(mapInvitation);
  },

  // Método para actualizar una invitación existente
  async update(id: string, data: Partial<Invitation>): Promise<void> {
    const updateData = { ...data };
    
    // Eliminar campos que no deben actualizarse
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.accessCode;
    
    // Agregar fecha de actualización
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection(COLLECTION_NAME).doc(id).update(updateData);
  },

  // Método para eliminar una invitación de Firestore
  // @param id - ID del documento a eliminar
  async delete(id: string): Promise<void> {
    await db.collection(COLLECTION_NAME).doc(id).delete();
  },
};