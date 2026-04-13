import { NextRequest, NextResponse } from "next/server";

// Obtenemos el nombre de la cookie desde las variables de entorno
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "__session";

// Cambiamos el nombre de la función de 'middleware' a 'proxy'
export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Solo protegemos las rutas que empiecen con /dashboard
    if (!pathname.startsWith("/dashboard")) return NextResponse.next();

    // Verificamos si existe la cookie de sesión
    const hasSession = req.cookies.get(COOKIE)?.value;
    
    if (hasSession) return NextResponse.next();

    // Si no hay sesión, redirigimos al login y guardamos la ruta de origen
    const url = new URL("/login", req.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
}

// La configuración del matcher se mantiene igual
export const config = {
    matcher: ["/dashboard/:path*"],
};