/**
 * Interfaz que representa un comentario en un evento.
 * Almacena la información del comentario incluyendo el autor.
 */
export interface Comment {
  id: string;                      // ID único del comentario
  eventId: string;                 // Evento al que pertenece
  userId: string;                  // Autor del comentario
  userName: string;                // Nombre visible del autor
  userPhoto?: string;              // Foto de perfil (opcional)
  text: string;                   // El mensaje en sí
  createdAt?: string;             // Cuándo se escribió
  isOwner?: boolean;              // ¿Es el comentario del usuario actual?
}