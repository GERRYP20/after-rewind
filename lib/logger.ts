/**
 * Logger de eventos de seguridad - Módulo de seguridad (solo servidor)
 *
 * Centraliza el registro de eventos sensibles (rate limiting, bloqueos
 * por intentos fallidos, logins) tanto en consola (Runtime Logs de Vercel)
 * como en Firestore, para poder consultarlos después desde el panel de
 * administrador aunque los logs de Vercel ya hayan expirado.
 *
 * NUNCA importar este archivo desde componentes cliente.
 */
import { LogRepository } from "./logs/log.repository";
import { LogEventType } from "./logs/log.types";

export function logSecurityEvent(
  type: LogEventType,
  ip: string,
  message: string,
  meta?: Record<string, unknown>,
  statusCode?: number
): void {
  // Log inmediato en consola: lo capturan los Runtime Logs de Vercel
  console.log(
    JSON.stringify({ level: "security", type, ip, message, statusCode, meta, at: new Date().toISOString() })
  );

  // Persistencia en Firestore sin bloquear la respuesta al cliente
  LogRepository.create({ type, ip, message, statusCode, meta }).catch((error) => {
    console.error("No se pudo persistir el log de seguridad en Firestore:", error);
  });
}
