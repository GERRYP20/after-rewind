/**
 * Tipos de datos para el sistema de gestión de invitados de AFTER-REWIND
 * Representa la relación entre un usuario y un evento al que se ha unido
 */

/**
 * Interfaz que representa un invitado en un evento
 * Se almacena en la colección 'event_guests' de Firestore
 */
export interface EventGuest {
  // ID único del documento en Firestore (generado automáticamente)
  id?: string;
  // ID del evento al que pertenece el invitado (referencia a 'invitations')
  eventId: string;
  // ID del usuario en Firebase Auth que se unió al evento
  userId: string;
  // Nombre del usuario (obtenido del token de sesión)
  userName: string;
  // Estado de la solicitud del invitado
  // 'pending' = esperando aprobación del creador (para eventos privados)
  // 'confirmed' = confirmado y contando en guestCount
  status: 'pending' | 'confirmed';
  // Fecha en que el usuario se unió al evento (formato ISO)
  createdAt: string;
}

/**
 * Tipo para crear un nuevo invitado (sin id, ya que se genera automáticamente)
 */
export type CreateEventGuestData = Omit<EventGuest, 'id'>;

/**
 * Tipo para actualizar el estado de un invitado
 */
export type UpdateGuestStatus = {
  status: 'pending' | 'confirmed';
};