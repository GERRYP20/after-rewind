/**
 * Firebase Client SDK - Configuración del lado del cliente
 * 
 * Este archivo se ejecuta EN EL NAVEGADOR y sus variables son públicas.
 * Solo usar para operaciones de autenticación del cliente.
 * 
 * Las variables NEXT_PUBLIC_* son seguras para el navegador porque son API keys
 * de solo lectura (no permiten acceder a datos sin reglas de Firebase).
 * 
 * Fortalezas:
 * - Configuración simple y directa
 * - Variables públicas para el navegador
 * - Persistencia configurable (local o sesión)
 */
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signOut,
} from "firebase/auth";

// Configuración pública de Firebase para el cliente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializamos la app asegurándonos de no duplicar la instancia
const app =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Instancia de autenticación para el frontend
export const auth = getAuth(app);

/**
 * Configura si la sesión se guarda permanentemente o solo por pestaña
 */
export async function configureAuthPersistence(remember: boolean) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}