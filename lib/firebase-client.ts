import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
console.log("API KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const app =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export async function configureAuthPersistence(remember: boolean) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}