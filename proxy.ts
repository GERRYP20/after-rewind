import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Obtenemos el nombre de la cookie desde las variables de entorno
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "session";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Solo protegemos las rutas que empiecen con /dashboard
    if (!pathname.startsWith("/dashboard")) return NextResponse.next();

    // Verificamos la sesión con Firebase Admin: firma JWT y expiración reales.
    // Cualquier cookie falsa o manipulada es rechazada aquí.
    const sessionCookie = req.cookies.get(COOKIE)?.value;

    if (sessionCookie) {
        try {
            await adminAuth.verifySessionCookie(sessionCookie, false);
            return NextResponse.next();
        } catch {
            // Cookie inválida o expirada: la eliminamos y tratamos como no autenticado
            const redirect = NextResponse.redirect(buildLoginUrl(req, pathname));
            redirect.cookies.delete(COOKIE);
            return redirect;
        }
    }

    // Si no hay sesión, redirigimos al login y guardamos la ruta de origen
    return NextResponse.redirect(buildLoginUrl(req, pathname));
}

function buildLoginUrl(req: NextRequest, pathname: string) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirectTo", pathname);
    return url;
}

// La configuración del matcher se mantiene igual
export const config = {
    matcher: ["/dashboard/:path*"],
};