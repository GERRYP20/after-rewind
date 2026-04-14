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

// Configuración de Firebase - estas variables son PÚBLICAS (NEXT_PUBLIC_*)
// Son seguras porque Firebase las usa solo para identificar el proyecto
// El acceso a datos se controla con las reglas de seguridad de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicialización segura: usa la app existente si ya está inicializada
const app =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Exportamos la instancia de auth para usarla en los componentes cliente
export const auth = getAuth(app);

/**
 * Configurar la persistencia de la sesión
 * 
 * @param remember - true = sesión persiste al cerrar el navegador (localStorage)
 *                   false = sesión solo dura mientras el navegador está abierto (sessionStorage)
 * 
 * NOTA: Llamar esto antes de operaciones de auth puede causar problemas.
 * Es mejor configurarlo una vez al cargar la app, no antes de cada login.
 */
export async function configureAuthPersistence(remember: boolean) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}