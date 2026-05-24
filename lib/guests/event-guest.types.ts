/**
 * Tipos de datos para el sistema de gestión de invitados de AFTER-REWIND
 * Representa la relación entre un usuario y un evento al que se ha unido
 */

/**
 * Interfaz que representa un invitado en un evento
 * Se almacena en la colección 'event_guests' de Firestore
 */
export interface EventGuest {
  id?: string;             // ID del registro en Firestore
  eventId: string;         // Evento al que se une
  userId: string;          // Usuario que se une
  userName: string;        // Nombre del usuario
  userPhoto?: string | null; // Foto del usuario (permitimos null para Firestore)
  status: 'pending' | 'confirmed'; // Estado de la solicitud
  createdAt: string;       // Fecha de unión
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