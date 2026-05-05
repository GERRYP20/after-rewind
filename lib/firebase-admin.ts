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

// Sanitización de la private key para manejar correctamente saltos de línea y comillas en .env
const privateKey = privateKeyFromEnv
  .replace(/^["']|["']$/g, "")           // Elimina comillas al inicio o final
  .replace(/\\n/g, "\n")                 // Convierte \n literal a saltos de línea reales
  .split("\n")
  .filter(line => line.length > 0)        // Elimina líneas vacías accidentales
  .join("\n");

// Verificación del formato PEM para asegurar que la llave es válida para el SDK
if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
  throw new Error("FIREBASE_PRIVATE_KEY es inválida: falta el encabezado PEM");
}

/**
 * Singleton pattern para inicializar la App de Firebase.
 * Next.js en desarrollo recarga archivos constantemente; getApps() evita 
 * intentar inicializar una app que ya existe en memoria.
 */
export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

/**
 * Exportamos los servicios principales para el backend de After-Rewind.
 * - adminAuth: Usado en API routes para verificar la cookie de sesión[cite: 2].
 * - db: Instancia de Firestore usada en los Repositories para persistencia[cite: 2].
 */
export const adminAuth = getAuth(adminApp);
export const db = getFirestore(adminApp);