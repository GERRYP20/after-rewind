/**
 * Interfaz que representa un comentario en un evento.
 * Almacena la información del comentario incluyendo el autor.
 */
export interface Comment {
  id: string;                      // ID único del comentario en Firestore
  eventId: string;                 // ID del evento al que pertenece el comentario
  userId: string;                  // ID del usuario que escribió el comentario
  userName: string;                // Nombre del usuario que escreveu el comentario
  text: string;                   // Contenido del comentario
  createdAt?: string;             // Fecha de creación en formato ISO (opcional)
  isOwner?: boolean;              // Indica si el usuario actual es el autor del comentario
}