/**
 * Tipos de datos para el sistema de fotos de AFTER-REWIND
 * Aquí definimos cómo se guarda cada imagen subida por los usuarios
 */

export interface EventPhoto {
  id?: string;             // ID único generado por Firestore
  eventId: string;         // A qué evento pertenece esta foto
  userId: string;          // Quién subió la foto
  userName: string;        // Nombre de la persona que la subió
  url: string;             // Link seguro de Cloudinary
  createdAt: string;       // Cuándo se subió
}

// Tipo simplificado para cuando estamos creando una foto nueva
export type CreateEventPhotoData = Omit<EventPhoto, "id" | "createdAt">;
