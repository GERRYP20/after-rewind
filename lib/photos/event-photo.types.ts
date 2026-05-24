/**
 * Tipos de datos para el sistema de fotos de AFTER-REWIND
 * Aquí definimos cómo se guarda cada imagen subida por los usuarios
 */

export interface EventPhoto {
  id?: string;             // ID único en Firestore
  eventId: string;         // Referencia al evento
  userId: string;          // Autor de la subida
  userName: string;        // Nombre del autor
  url: string;             // URL de la imagen en Cloudinary
  createdAt: string;       // Fecha de subida
}

// Tipo simplificado para cuando estamos creando una foto nueva
export type CreateEventPhotoData = Omit<EventPhoto, "id" | "createdAt">;
