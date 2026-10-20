"""
BOT DE FALSIFICACION DE COOKIES v1.0
Demuestra el Metodo 5: verificacion de integridad criptografica (HMAC).

Un bot intenta falsear la cookie de acceso captcha_pass:
  1. Cookie "captcha_pass=1" (el truco que funcionaba antes) -> passed=false
  2. Token con firma falsa (payload manipulado)             -> passed=false
  3. Flujo legitimo: resolver el reto y obtener la cookie
     firmada de verdad                                      -> passed=true

Antes del Metodo 5, la cookie era el literal "1" y el servidor
la aceptaba con value === "1": cualquier bot pasaba el gate.

Uso: python bot_cookie.py [URL_BASE]
     python bot_cookie.py http://localhost:3000
"""
import sys
import io
import json
import base64
import time

import requests

# Consola de Windows: forzar UTF-8 para ver bien los acentos
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")

RESULTADOS = []


def comprobar(nombre, esperado, obtenido, detalle=""):
    ok = obtenido == esperado
    RESULTADOS.append(ok)
    estado = "PROTEGIDO" if ok else "VULNERABLE"
    print(f"  [{estado}] {nombre}")
    print(f"      esperado: {esperado} | obtenido: {obtenido} {detalle}")


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def main():
    print("=" * 62)
    print("BOT DE FALSIFICACION v1.0 - intentando falsear captcha_pass")
    print(f"Objetivo: {BASE}")
    print("=" * 62)

    s = requests.Session()

    # ── PRUEBA 1: cookie primitiva "1" (el truco que funcionaba) ─────────
    print("\n[PRUEBA 1] Cookie captcha_pass=1 (falsificacion trivial)")
    r = s.get(f"{BASE}/api/captcha/status", cookies={"captcha_pass": "1"}, timeout=10)
    passed = r.json().get("passed")
    comprobar(
        "Cookie literal '1'",
        False,
        passed,
        f"| status HTTP {r.status_code}",
    )

    # ── PRUEBA 2: token bien formado pero con firma falsa ────────────────
    print("\n[PRUEBA 2] Token con payload y firma fabricados por el bot")
    payload = b64url(json.dumps({"exp": int(time.time()) + 36000}).encode())
    token_falso = f"{payload}.{b64url(b'FIRMA_MALICIOSA_DEL_BOT')}"
    r = s.get(
        f"{BASE}/api/captcha/status",
        cookies={"captcha_pass": token_falso},
        timeout=10,
    )
    passed = r.json().get("passed")
    comprobar(
        "Token con firma falsa",
        False,
        passed,
        f"| status HTTP {r.status_code}",
    )

    # ── PRUEBA 3: payload manipulado conservando una firma vieja ─────────
    print("\n[PRUEBA 3] Reutilizacion de firma (replay/tamper del payload)")
    # El bot toma un token LEGITIMO (obtenido abajo no aplica aqui), asi que
    # fabrica uno con exp irreal y firma basura; ningun caso debe pasar.
    payload_alargo = b64url(json.dumps({"exp": 9999999999999}).encode())
    r = s.get(
        f"{BASE}/api/captcha/status",
        cookies={"captcha_pass": f"{payload_alargo}.{b64url(b'otra_firma') }"},
        timeout=10,
    )
    passed = r.json().get("passed")
    comprobar(
        "Payload con exp irreal + firma inválida",
        False,
        passed,
        f"| status HTTP {r.status_code}",
    )

    # ── PRUEBA 4: flujo legitimo (resuelve el puzzle como bot_ataque) ───
    print("\n[PRUEBA 4] Flujo legitimo: resolver el reto y obtener cookie real")
    r = s.get(f"{BASE}/api/captcha", timeout=10)
    if r.status_code != 200:
        print(f"      (no se pudo obtener el reto: HTTP {r.status_code})")
        comprobar("Cookie firmada legítima", True, False, "| no se pudo obtener reto")
    else:
        reto = r.json()
        r2 = s.post(
            f"{BASE}/api/captcha/verify",
            json={
                "captchaToken": reto["token"],
                "captchaOffsetX": reto["gapX"],
                "captchaOffsetY": reto["gapY"],
            },
            timeout=10,
        )
        # Nota: en entorno local la cookie sale con el flag "secure" y la
        # librería requests no la reenvía por HTTP (el navegador en
        # localhost sí lo hace). Extraemos el valor y lo enviamos a mano.
        valor_cookie = s.cookies.get("captcha_pass")
        r3 = s.get(
            f"{BASE}/api/captcha/status",
            cookies={"captcha_pass": valor_cookie} if valor_cookie else {},
            timeout=10,
        )
        passed = r3.json().get("passed")
        print(f"      verify -> HTTP {r2.status_code} | cookie obtenida: {bool(valor_cookie)}")
        comprobar(
            "Cookie firmada legítima",
            True,
            passed,
            f"| status HTTP {r3.status_code}",
        )

    # ── Resumen ──────────────────────────────────────────────────────────
    print("\n" + "=" * 62)
    protegidos = sum(RESULTADOS)
    total = len(RESULTADOS)
    if protegidos == total:
        print(f"RESULTADO: {protegidos}/{total} casos correctos.")
        print("El Metodo 5 (integridad HMAC) rechaza cookies falsificadas")
        print("y acepta solo cookies firmadas por el servidor.")
    else:
        print(f"RESULTADO: {total - protegidos}/{total} casos FALLARON.")
        print("Revisar la implementacion del Metodo 5.")
    print("=" * 62)
    sys.exit(0 if protegidos == total else 1)


if __name__ == "__main__":
    main()
