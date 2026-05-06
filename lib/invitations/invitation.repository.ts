// Importamos la conexión a Firestore desde firebase-admin
// Esto nos permite leer y escribir en la base de datos
import { db } from "../firebase-admin";

// Importamos los tipos de Invitation para tener consistencia en los datos
import { Invitation } from "./invitation.types";

// Nombre de la colección en Firestore donde guardamos las invitaciones
// Cada documento en esta colección representa una invitación
const COLLECTION_NAME = "invitations";

// Acá centramos todas las operaciones posibles con las invitaciones
// Es como un punto único de acceso a los datos de invitaciones
export const InvitationRepository = {
  // Método para guardar una nueva invitación en la base de datos
  // Recibe los datos sin el ID porque Firestore lo genera automáticamente
  async create(data: Omit<Invitation, "id">): Promise<string> {
    // Añadimos un nuevo documento a la colección de invitaciones
    // y le agregamos la fecha de creación como campo extra
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(), // Firebase Admin lo guardará como Timestamp
    });
    // Devolvemos el ID que Firestore generó para esta invitación
    return docRef.id;
  },

  // Método para traer todas las invitaciones que pertenecen a un usuario
  // Esto se usa cuando el usuario entra a su dashboard y quiere ver sus eventos
  async getByUser(userId: string): Promise<Invitation[]> {
    // Consultamos la colección buscando solo las que fueron creadas por este usuario
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("createdBy", "==", userId)
      .get();
      
    // Convertimos cada documento de Firestore a un objeto de tipo Invitation
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // El ID del documento en Firestore
        ...data,    // El resto de campos del documento
        // Convertimos el Timestamp a String ISO para que sea serializable en Next.js
        // Esto evita problemas al enviar los datos al frontend
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      } as unknown as Invitation;
    });
  },

  // Método para buscar una invitación específica usando su código de acceso
  // Esto sirve cuando alguien intenta acceder a un evento mediante el código
  async getByCode(code: string): Promise<Invitation | null> {
    // Buscamos en la colección donde el código coincida exactamente
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("accessCode", "==", code)
      .limit(1)
      .get();

    // Si no encontramos nada, devolvemos null para indicar que no existe
    if (snapshot.empty) return null;
    
    // Obtenemos el primer resultado (solo debería haber uno porque el código es único)
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // armamos el objeto de invitación con sus datos
    return { 
      id: doc.id, 
      ...data,
      // Misma conversión de fecha que en getByUser para mantener el formato consistente
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    } as unknown as Invitation;
  }
};