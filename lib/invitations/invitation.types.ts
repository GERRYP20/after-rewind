// Tipos de datos para el sistema de invitaciones de AFTER-REWIND
// AFTER-REWIND es una plataforma para gestionar eventos y crear memorias visuales

// Esta interfaz define cómo se estructura una invitación en la base de datos
export interface Invitation {
  // Identificador único de la invitación en Firestore (opcional porque se genera al crear)
  id?: string;
  // Nombre o título del evento, por ejemplo "Boda de Ana y Juan"
  title: string;
  // Fecha del evento en formato string (YYYY-MM-DD)
  date: string;
  // Lugar donde se realizará el evento
  location: string;
  // Código único que se comparten con los invitados para acceder al evento
  accessCode: string;
  // ID del usuario que creó la invitación (quien organiza el evento)
  createdBy: string;
  // Fecha y hora exactas de cuando se creó la invitación en el sistema
  createdAt?: string;
}

// Esta interfaz representa un comentario en un evento (funcionalidad futura)
export interface Comment {
  // ID único del comentario
  id?: string;
  // ID del usuario que escribió el comentario
  userId: string;
  // Nombre que se muestra del usuario que comentou
  userName: string;
  // El contenido del comentario en sí
  text: string;
  // Momento en que se publicó el comentario
  timestamp: Date;
}