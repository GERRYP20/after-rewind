export const runtime = "nodejs";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "__session";

export async function getServerUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  try {
    // Verificamos la cookie de sesión con el Admin SDK
    const decoded = await adminAuth.verifySessionCookie(token, true);
    return decoded as {
      uid: string;
      email?: string;
      name?: string;
      picture?: string;
    };
  } catch {
    return null;
  }
}