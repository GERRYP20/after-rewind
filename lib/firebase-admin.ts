/**
 * Firebase Admin SDK - Configuración del lado del servidor
 * 
 * Este archivo solo debe usarse en código del servidor (API routes, server components).
 * NUNCA importar este archivo desde componentes cliente.
 * 
 * Fortalezas:
 * - Validación proactiva de credenciales al iniciar
 * - Manejo robusto de diferentes formatos de private key en .env
 * - Singleton pattern para evitar múltiples inicializaciones
 */
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Credenciales del servidor - estas son PRIVADAS y nunca se exponen al navegador
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyFromEnv = process.env.FIREBASE_PRIVATE_KEY;

// Validación proactiva: fallamos rápido si falta algo en la configuración
// Esto evita errores misteriosos después en tiempo de ejecución
if (!projectId || !clientEmail || !privateKeyFromEnv) {
  throw new Error(
    `Faltan credenciales de Firebase Admin. ` +
    `projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, privateKey: ${!!privateKeyFromEnv}`
  );
}

// Sanitización de la private key
// Los archivos .env suelen tener \n como texto literal (dos caracteres), no como saltos de línea reales
// Esta limpieza maneja automáticamente esos casos
const privateKey = privateKeyFromEnv
  .replace(/^["']|["']$/g, "")           // Elimina comillas extra si las hay
  .replace(/\\n/g, "\n")                 // Convierte \n literal a saltos de línea reales
  .split("\n")
  .filter(line => line.length > 0)        // Elimina líneas vacías
  .join("\n");

// Verificación adicional: aseguramos de que el PEM sea válido
if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
  throw new Error("FIREBASE_PRIVATE_KEY es inválida: falta el encabezado PEM");
}

// Singleton pattern: solo inicializa si no existe ya una instancia
// Esto previene errores de "Firebase ya inicializado"
export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

// Exportamos adminAuth para usarlo en las API routes
export const adminAuth = getAuth(adminApp);