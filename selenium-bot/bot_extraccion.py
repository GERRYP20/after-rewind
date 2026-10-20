"""
BOT DE EXTRACCION DE INFORMACION v1.0
Demuestra el Metodo 4: Autenticacion y autorizacion obligatoria en endpoints.

Un bot anónimo intenta extraer información de la aplicación SIN credenciales:
  1. GET  /api/invitations/<id>  -> debe fallar con 401
  2. POST /api/upload            -> debe fallar con 401
  3. GET  /dashboard             -> debe redirigir a /login

Antes del Metodo 4, los puntos 1 y 2 eran PUBLICOS: un bot podía
extraer eventos (incluido su accessCode) y subir archivos sin sesión.

Uso: python bot_extraccion.py [URL_BASE] [ID_EVENTO]
     python bot_extraccion.py http://localhost:3000
"""
import sys
import io

import requests

# Consola de Windows: forzar UTF-8 para ver bien los acentos
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")
# ID de un evento conocido para la prueba (se puede pasar por argumento)
EVENT_ID = sys.argv[2] if len(sys.argv) > 2 else "demo"

RESULTADOS = []


def comprobar(nombre, esperado, obtenido, detalle=""):
    ok = obtenido == esperado
    RESULTADOS.append(ok)
    estado = "PROTEGIDO" if ok else "VULNERABLE"
    print(f"  [{estado}] {nombre}")
    print(f"      esperado: {esperado} | obtenido: {obtenido} {detalle}")


def main():
    print("=" * 62)
    print("BOT DE EXTRACCION v1.0 - intentando robar datos SIN sesion")
    print(f"Objetivo: {BASE}")
    print("=" * 62)

    s = requests.Session()  # sin cookies: somos un atacante anónimo

    # ── PRUEBA 1: extraer una invitación por ID ──────────────────────────
    print("\n[PRUEBA 1] GET /api/invitations/<id> sin sesión")
    try:
        r = s.get(f"{BASE}/api/invitations/{EVENT_ID}", timeout=10, allow_redirects=False)
        comprobar(
            "Extracción de evento",
            401,
            r.status_code,
            f"| cuerpo: {r.text[:80]}",
        )
    except requests.RequestException as e:
        print(f"      (no se pudo conectar: {e})")

    # ── PRUEBA 2: subir un archivo a Cloudinary sin sesión ───────────────
    print("\n[PRUEBA 2] POST /api/upload sin sesión")
    try:
        r = s.post(
            f"{BASE}/api/upload",
            files={"file": ("falso.txt", b"contenido malicioso del bot", "text/plain")},
            timeout=10,
            allow_redirects=False,
        )
        comprobar(
            "Subida de archivos",
            401,
            r.status_code,
            f"| cuerpo: {r.text[:80]}",
        )
    except requests.RequestException as e:
        print(f"      (no se pudo conectar: {e})")

    # ── PRUEBA 3: acceder al dashboard sin sesión ────────────────────────
    print("\n[PRUEBA 3] GET /dashboard sin sesión")
    try:
        r = s.get(f"{BASE}/dashboard", timeout=10, allow_redirects=False)
        ubicacion = r.headers.get("Location", "")
        print(f"      Location: {ubicacion}")
        comprobar(
            "Acceso al dashboard",
            307,
            r.status_code,
            f"| redirige a login: {'login' in ubicacion}",
        )
    except requests.RequestException as e:
        print(f"      (no se pudo conectar: {e})")

    # ── Resumen ──────────────────────────────────────────────────────────
    print("\n" + "=" * 62)
    protegidos = sum(RESULTADOS)
    total = len(RESULTADOS)
    if protegidos == total:
        print(f"RESULTADO: {protegidos}/{total} rutas PROTEGIDAS contra bots anónimos.")
        print("El Metodo 4 (autenticacion obligatoria) bloquea la extraccion.")
    else:
        print(f"RESULTADO: {total - protegidos}/{total} rutas SIGUEN VULNERABLES.")
        print("Revisar la implementacion del Metodo 4.")
    print("=" * 62)
    sys.exit(0 if protegidos == total else 1)


if __name__ == "__main__":
    main()
