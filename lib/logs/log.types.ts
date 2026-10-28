// Tipos de evento de seguridad que el sistema registra en Firestore
export type LogEventType =
  | "rate_limit_exceeded"
  | "login_blocked_attempts"
  | "captcha_failed"
  | "login_success"
  | "login_error";

export interface LogEntry {
  id: string;
  type: LogEventType;
  ip: string;
  resource?: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: string; // ISO string
}
