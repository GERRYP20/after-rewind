/**
 * Firebase Admin SDK - Configuración del lado del servidor
 * 
 * Este archivo solo debe usarse en código del servidor (API routes, server components).
 * NUNCA importar este archivo desde componentes cliente.
 */
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
// Importamos Firestore para el manejo de la base de datos
import { getFirestore } from "firebase-admin/firestore";

// Credenciales del servidor extraídas de las variables de entorno
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyFromEnv = process.env.FIREBASE_PRIVATE_KEY;

// Validación proactiva de credenciales
if (!projectId || !clientEmail || !privateKeyFromEnv) {
  throw new Error(
    `Faltan credenciales de Firebase Admin. ` +
    `projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, privateKey: ${!!privateKeyFromEnv}`
  );
}

// Sanitización de la private key para manejar saltos de línea y comillas
const privateKey = privateKeyFromEnv
  .replace(/^["']|["']$/g, "")           // Elimina comillas extra
  .replace(/\\n/g, "\n")                 // Convierte \n literal a saltos de línea reales
  .split("\n")
  .filter(line => line.length > 0)        // Elimina líneas vacías
  .join("\n");

// Verificación del formato PEM
if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
  throw new Error("FIREBASE_PRIVATE_KEY es inválida: falta el encabezado PEM");
}

// Singleton pattern para inicializar la App de Firebase[cite: 2]
export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

// Exportamos los servicios para ser usados en el Repository Pattern y API Routes[cite: 2]
export const adminAuth = getAuth(adminApp);
export const db = getFirestore(adminApp);