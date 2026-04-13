import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Función para limpiar la llave de cualquier formato extraño
const formatPrivateKey = (key: string | undefined) => {
  if (!key) return undefined;
  // Quita comillas accidentales y arregla los saltos de línea
  return key.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
};

const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

export const adminAuth = getAuth(adminApp);