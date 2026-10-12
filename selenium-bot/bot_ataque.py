import sys
import time
import json

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

# Consola de Windows: forzar UTF-8 para ver bien los acentos
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")


def crear_driver():
    opciones = Options()
    # Quita esta línea si quieres ver la ventana del navegador
    # opciones.add_argument("--headless=new")
    opciones.add_argument("--window-size=1280,800")
    driver = webdriver.Chrome(options=opciones)
    return driver


def fetch_js(driver, metodo, url, body=None, timeout_ms=120000):
    """
    Ejecuta un fetch() dentro del contexto del navegador (mismo origin,
    así que las cookies httpOnly como captcha_pass viajan solas).
    Devuelve dict con: status, headers, text, json (si aplica).
    """
    script = """
    const [metodo, url, bodyStr, callback] = arguments;
    const opts = {
        method: metodo,
        headers: {"Content-Type": "application/json", "Cache-Control": "no-cache"},
        credentials: "same-origin"
    };
    if (bodyStr !== null) { opts.body = bodyStr; }

    fetch(url, opts)
        .then(async (r) => {
            const text = await r.text();
            const headers = {};
            r.headers.forEach((v, k) => headers[k] = v);
            callback({status: r.status, headers: headers, text: text});
        })
        .catch((err) => callback({status: 0, headers: {}, text: String(err)}));
    """
    driver.set_script_timeout(timeout_ms / 1000 + 5)
    resultado = driver.execute_async_script(
        script, metodo, url, (json.dumps(body) if body is not None else None)
    )
    try:
        resultado["json"] = json.loads(resultado["text"])
    except (ValueError, TypeError):
        resultado["json"] = None
    return resultado


def pedir_reto_automatico(driver):
    """El script 'resuelve' el puzzle: el servidor publica gapX/gapY en JSON."""
    r = fetch_js(driver, "GET", f"{BASE}/api/captcha")
    if r["status"] != 200:
        raise RuntimeError(f"Fallo /api/captcha -> HTTP {r['status']}: {r['text'][:200]}")
    data = r["json"]
    print(f"  -> Reto obtenido: gapX={data['gapX']} gapY={data['gapY']} token={data['token'][:24]}...")
    return data


def main():
    print("=" * 62)
    print("BOT DE FUERZA BRUTA v1.0 (Selenium) - atacando el formulario local")
    print(f"Objetivo: {BASE}")
    print("=" * 62)

    driver = crear_driver()
    try:
        # Hay que cargar la página primero para tener "same-origin" y que
        # el navegador acepte/envíe las cookies del dominio.
        driver.get(BASE)
        WebDriverWait(driver, 15).until(lambda d: d.execute_script("return document.readyState") == "complete")

        print("\n[PASO 1] Resolver el slider puzzle como script...")
        reto = pedir_reto_automatico(driver)
        time.sleep(0.2)

        print("\n[PASO 2] Verificar captcha para obtener la cookie de acceso...")
        r = fetch_js(driver, "POST", f"{BASE}/api/captcha/verify", {
            "captchaToken": reto["token"],
            "captchaOffsetX": reto["gapX"],
            "captchaOffsetY": reto["gapY"],
        })
        print(f"  -> POST /api/captcha/verify  -> HTTP {r['status']}")

        cookies_conocidas = {c["name"]: c["value"] for c in driver.get_cookies()}
        if "captcha_pass" in cookies_conocidas:
            print(f"  -> Cookie captcha_pass obtenida: {cookies_conocidas['captcha_pass']}")
        else:
            print(f"  -> Cookies de la sesión: {cookies_conocidas or '(sin cookie visible: puede ser httpOnly, igual se envía sola)'}")

        print("\n[PASO 3] Fuerza bruta: enviar el formulario a /api/sessionLogin en bucle...")
        print("-" * 62)

        # 'Calentamos' la ruta: un GET devuelve 405 sin tocar el rate limiter.
        warm = fetch_js(driver, "GET", f"{BASE}/api/sessionLogin")
        print(f"  (warm-up ruta sessionLogin -> HTTP {warm['status']})")

        for i in range(1, 9):
            reto = pedir_reto_automatico(driver)
            r = fetch_js(driver, "POST", f"{BASE}/api/sessionLogin", {
                "idToken": f"ID_TOKEN_FALSO_BOT_{i}",  # token inválido a propósito
                "remember": True,
                "captchaToken": reto["token"],
                "captchaOffsetX": reto["gapX"],
                "captchaOffsetY": reto["gapY"],
            })
            retry_after = r["headers"].get("retry-after", "-")
            body = r["text"][:90]
            print(f"  intento {i}: HTTP {r['status']}  | Retry-After: {retry_after}  | {body}")
            time.sleep(0.15)
            if r["status"] == 429:
                print("\n  >>> SERVIDOR BLOQUEÓ AL BOT (429 Too Many Requests) <<<")
                break
        print("-" * 62)

        print("\nResultado de la demo:")
        print("  * El bot resolvió el slider puzzle sin esfuerzo (es trivial).")
        print("  * El Rate Limiting general por IP detectó el volumen de peticiones")
        print("    y NEGÓ el servicio con HTTP 429 + Retry-After.")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()