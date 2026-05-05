export interface Invitation {
  id?: string;
  title: string;
  date: string;
  location: string;
  accessCode: string;
  createdBy: string; // ID del usuario que creó el evento[cite: 1]
  createdAt?: string;
}

export interface Comment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}