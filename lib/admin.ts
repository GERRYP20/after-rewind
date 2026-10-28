/**
 * Control de acceso de administrador (solo servidor)
 *
 * No existe todavía un sistema de roles en Firestore/Auth, así que por
 * simplicidad el acceso de administrador se define por una lista de
 * correos en la variable de entorno ADMIN_EMAILS (separados por coma).
 *
 * NUNCA importar este archivo desde componentes cliente.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
