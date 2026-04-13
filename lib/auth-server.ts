/**
 * Utilidades de autenticación para Server Components
 * 
 * Este módulo proporciona funciones para verificar usuarios desde el servidor.
 * Ideal para usar en Server Components o API routes que necesitan saber
 * quién está haciendo la petición.
 * 
 * Fortalezas:
 * - Fallo silencioso seguro (devuelve null, no expone detalles del error)
 * - Tipado completo con TypeScript
 * - Función reutilizable para cualquier server component
 */
export const runtime = "nodejs";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

// Nombre de la cookie de sesión (configurable via .env)
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "__session";

/**
 * Obtiene el usuario actual desde la cookie de sesión
 * 
 * Esta función puede usarse en cualquier Server Component para obtener
 * el usuario autenticado sin necesidad de pasar props desde el cliente.
 * 
 * @returns Los datos del usuario si está autenticado, null si no lo está
 * 
 * Ejemplo de uso:
 * ```typescript
 * import { getServerUser } from "@/lib/auth-server";
 * 
 * async function DashboardPage() {
 *   const user = await getServerUser();
 *   if (!user) redirect("/login");
 *   return <h1>Bienvenido {user.name}</h1>;
 * }
 * ```
 */
export async function getServerUser() {
  // Obtenemos la cookie de sesión
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  try {
    // Verificamos la cookie con Firebase Admin SDK
    // El segundo parámetro (true) verifica si la cookie fue revocada
    const decoded = await adminAuth.verifySessionCookie(token, true);
    return decoded as {
      uid: string;
      email?: string;
      name?: string;
      picture?: string;
    };
  } catch {
    // Fallo silencioso: devolvemos null en vez de lanzar error
    // Esto es intencional - no queremos exponer detalles técnicos
    return null;
  }
}