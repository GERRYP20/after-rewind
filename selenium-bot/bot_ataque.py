
import sys
import time

import requests

# Consola de Windows: forzar UTF-8 para ver bien los acentos
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")
SESSION = requests.Session()


def pedir_reto_automatico():
    """El script 'resuelve' el puzzle: el servidor publica gapX/gapY en JSON."""
    r = SESSION.get(f"{BASE}/api/captcha", timeout=10, headers={"Cache-Control": "no-cache"})
    r.raise_for_status()
    data = r.json()
    print(f"  -> Reto obtenido: gapX={data['gapX']} gapY={data['gapY']} token={data['token'][:24]}...")
    return data


def main():
    print("=" * 62)
    print("BOT DE FUERZA BRUTA v1.0  -  atacando el formulario local")
    print(f"Objetivo: {BASE}")
    print("=" * 62)

    print("\n[PASO 1] Resolver el slider puzzle como script...")
    reto = pedir_reto_automatico()
    time.sleep(0.2)

    print("\n[PASO 2] Verificar captcha para obtener la cookie de acceso...")
    r = SESSION.post(
        f"{BASE}/api/captcha/verify",
        json={
            "captchaToken": reto["token"],
            "captchaOffsetX": reto["gapX"],
            "captchaOffsetY": reto["gapY"],
        },
        timeout=10,
    )
    print(f"  -> POST /api/captcha/verify  -> HTTP {r.status_code}")
    cookies_conocidas = SESSION.cookies.get_dict()
    if "captcha_pass" in cookies_conocidas:
        print(f"  -> Cookie captcha_pass obtenida: {cookies_conocidas['captcha_pass']}")
    else:
        print(f"  -> Cookies de la sesión: {cookies_conocidas or '(sin cookie visible: se marca con Set-Cookie httpOnly)'}")

    print("\n[PASO 3] Fuerza bruta: enviar el formulario a /api/sessionLogin en bucle...")
    print("-" * 62)

    # 'Calentamos' la ruta: Turbopack compila las rutas bajo demanda y la primera
    # petición a /api/sessionLogin tarda bastante en dev. Un GET devuelve 405 sin
    # tocar el rate limiter (su lógica vive en el handler POST).
    warm = SESSION.get(f"{BASE}/api/sessionLogin", timeout=120)
    print(f"  (warm-up ruta sessionLogin -> HTTP {warm.status_code})")

    for i in range(1, 9):
        reto = pedir_reto_automatico()
        r = SESSION.post(
            f"{BASE}/api/sessionLogin",
            json={
                "idToken": f"ID_TOKEN_FALSO_BOT_{i}",      # token inválido a propósito
                "remember": True,
                "captchaToken": reto["token"],
                "captchaOffsetX": reto["gapX"],
                "captchaOffsetY": reto["gapY"],
            },
            timeout=120,
        )
        retry_after = r.headers.get("Retry-After", "-")
        body = r.text[:90]
        print(f"  intento {i}: HTTP {r.status_code}  | Retry-After: {retry_after}  | {body}")
        time.sleep(0.15)
        if r.status_code == 429:
            print("\n  >>> SERVidOR BLOQUEÓ AL BOT (429 Too Many Requests) <<<")
            break
    print("-" * 62)

    print("\nResultado de la demo:")
    print("  * El bot resolvió el slider puzzle sin esfuerzo (es trivial).")
    print("  * El Rate Limiting general por IP detectó el volumen de peticiones")
    print("    y NEGÓ el servicio con HTTP 429 + Retry-After.")


if __name__ == "__main__":
    main()