// Tipos de datos para el sistema de invitaciones de AFTER-REWIND
// AFTER-REWIND es una plataforma para gestionar eventos y crear memorias visuales

// Esta interfaz define cómo se estructura una invitación en la base de datos
export interface Invitation {
  id?: string;             // ID autogenerado por Firestore
  title: string;          // Título del evento
  date: string;           // Fecha programada
  location: string;       // Lugar del evento
  locationUrl?: string;   // Link a Google Maps
  accessCode: string;     // Código para que los invitados se unan
  createdBy: string;      // ID del creador
  createdAt?: string;     // Fecha de creación del registro
  imageUrl?: string;      // Imagen de portada
  updatedAt?: string;     // Última edición
  description?: string;   // Detalles adicionales
  category?: string;      // Tipo de evento
  visibility?: 'public' | 'private'; // ¿Cualquiera puede unirse o requiere aprobación?
  guestCount?: number;    // Total de confirmados
  hostName?: string;      // Nombre del anfitrión (para el UI)
  hostPhoto?: string | null; // Foto del anfitrión (para el UI)
}
