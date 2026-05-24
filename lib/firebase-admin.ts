/**
 * Firebase Admin SDK - Configuración del lado del servidor
 * 
 * Este archivo solo debe usarse en código del servidor (API routes, server components).
 * NUNCA importar este archivo desde componentes cliente para no exponer llaves privadas.
 */
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Credenciales del servidor extraídas de las variables de entorno
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyFromEnv = process.env.FIREBASE_PRIVATE_KEY;

// Validación proactiva de credenciales para evitar fallos silenciosos en el servidor
if (!projectId || !clientEmail || !privateKeyFromEnv) {
  throw new Error(
    `Faltan credenciales de Firebase Admin. ` +
    `projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, privateKey: ${!!privateKeyFromEnv}`
  );
}

// Sanitización de la private key para manejar correctamente saltos de línea en el entorno
const privateKey = privateKeyFromEnv
  .replace(/^["']|["']$/g, "")           // Limpiamos comillas accidentales
  .replace(/\\n/g, "\n")                 // Parseamos los saltos de línea literales
  .split("\n")
  .filter(line => line.length > 0)        // Quitamos líneas vacías
  .join("\n");

// Chequeo básico del formato PEM para la llave privada
if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
  throw new Error("FIREBASE_PRIVATE_KEY es inválida: falta el encabezado PEM");
}

/**
 * Singleton para inicializar Firebase Admin y evitar duplicados en desarrollo
 */
export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

/**
 * Exportamos los servicios principales para el backend
 */
export const adminAuth = getAuth(adminApp);
export const db = getFirestore(adminApp);