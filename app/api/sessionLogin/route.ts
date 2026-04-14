/**
 * API Route: Creación de sesión de servidor
 * 
 * Esta es la segunda fase de la autenticación. Después de que el usuario
 * hace login con Firebase en el cliente, llamamos a esta API para crear
 * una cookie de sesión que el servidor puede verificar.
 * 
 * Flujo completo de autenticación:
 * 1. Cliente: Firebase SDK valida credenciales → obtiene idToken
 * 2. Cliente: Envía idToken a esta API
 * 3. Servidor: Crea cookie de sesión con Admin SDK
 * 4. Cliente: Recibe cookie en el navegador
 * 5. Requests siguientes: El navegador envía la cookie automáticamente
 * 6. Servidor: El middleware/Server Components verifican la cookie
 * 
 * Fortalezas:
 * - Cookies httpOnly (seguras contra XSS)
 * - Configuración de seguridad según el entorno (production/development)
 * - Mensajes de error seguros (no exponen detalles internos)
 */
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Configuración de la cookie - configurable via .env
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "__session";
const MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE ?? 60 * 60 * 8); // 8 horas por defecto

/**
 * POST /api/sessionLogin
 * 
 * Body: { idToken: string, remember: boolean }
 * 
 * Crea una cookie de sesión segura para el navegador.
 */
export async function POST(req: Request) {
  try {
    // Extraemos el token de Firebase y la preferencia de "recordarme"
    const { idToken, remember } = await req.json();
    
    // Validación básica del token
    if (!idToken)
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

    // Duración de la sesión según preferencia del usuario
    // Si "recordarme" es true: sesión larga (configurada en .env)
    // Si es false: sesión corta (2 horas) - más seguro para computadoras compartidas
    const expiresIn = (remember ? MAX_AGE : 2 * 60 * 60) * 1000; // en milisegundos
    
    // Creamos la cookie de sesión usando Firebase Admin SDK
    // Esta cookie es un JWT que Firebase puede verificar
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Preparamos la respuesta con la cookie configurada
    const res = NextResponse.json({ ok: true });
    
    // Configuración de seguridad de la cookie
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,      // IMPEDIR que JavaScript lea la cookie (previene XSS)
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      sameSite: "lax",     // Previene ataques CSRF mientras permite navegación normal
      path: "/",           // La cookie está disponible en toda la app
      maxAge: expiresIn / 1000, // Expiración en segundos
    });

    return res;
  } catch (error) {
    // Logueamos el error internamente para debugging
    console.error("Session creation error:", error);
    
    // Al cliente devolvemos un mensaje genérico, NO los detalles del error
    // Esto previene information disclosure en caso de ataques o errores inesperados
    return NextResponse.json(
      { error: "Cannot create session" },
      { status: 401 },
    );
  }
}