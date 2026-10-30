// Tipos de evento que el sistema registra en Firestore:
// tanto eventos de seguridad como actividad normal de usuarios.
export type LogEventType =
  | "rate_limit_exceeded"
  | "login_blocked_attempts"
  | "captcha_failed"
  | "login_success"
  | "login_error"
  | "logout"
  | "event_created"
  | "comment_created"
  | "photo_uploaded"
  | "guest_joined";

export interface LogEntry {
  id: string;
  type: LogEventType;
  ip: string;
  resource?: string;
  message: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
  createdAt: string; // ISO string
}
