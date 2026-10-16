import re
import sys
import time
import json

import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")

MESES_ES = {
    "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12,
}


def crear_driver():
    opciones = Options()
    # No uses --headless aquí: necesitas ver la ventana para iniciar sesión
    # manualmente cuando el script haga la pausa.
    opciones.add_argument("--window-size=1366,900")
    return webdriver.Chrome(options=opciones)


def fetch_js(driver, metodo, url, body=None, timeout_ms=60000):
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
            callback({status: r.status, text: text});
        })
        .catch((err) => callback({status: 0, text: String(err)}));
    """
    driver.set_script_timeout(timeout_ms / 1000 + 5)
    resultado = driver.execute_async_script(script, metodo, url, json.dumps(body) if body is not None else None)
    try:
        resultado["json"] = json.loads(resultado["text"])
    except (ValueError, TypeError):
        resultado["json"] = None
    return resultado


def resolver_captcha(driver):
    print("[PASO 1] Resolviendo el desafío de seguridad...")
    r = fetch_js(driver, "GET", f"{BASE}/api/captcha")
    if r["status"] != 200:
        raise RuntimeError(f"No se pudo obtener el reto -> HTTP {r['status']}: {r['text'][:200]}")
    reto = r["json"]

    r = fetch_js(driver, "POST", f"{BASE}/api/captcha/verify", {
        "captchaToken": reto["token"],
        "captchaOffsetX": reto["gapX"],
        "captchaOffsetY": reto["gapY"],
    })
    if r["status"] != 200:
        raise RuntimeError(f"Verificación de captcha falló -> HTTP {r['status']}: {r['text'][:200]}")
    print("  -> Captcha resuelto, cookie de acceso obtenida.")
    driver.refresh()


def pausa_login_manual(driver):

    print("\n[PASO 2] Inicia sesión manualmente en la ventana del navegador.")
    input("         Cuando ya veas tu Dashboard, regresa aquí y presiona ENTER... ")


def ir_a_mis_eventos(driver):
    print("\n[PASO 3] Navegando a 'Mis Eventos' (/dashboard)...")
    driver.get(BASE + "/dashboard")
    WebDriverWait(driver, 20).until(lambda d: d.execute_script("return document.readyState") == "complete")

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "a.group.block[href*='/dashboard/invitaciones/']"))
        )
    except Exception:
        print("  -> No aparecieron tarjetas en 15s (puede que no haya eventos aún, o que falte login).")
    time.sleep(1)  


def extraer_eventos(driver):

    print("\n[PASO 4] Extrayendo datos de las tarjetas de eventos...")

    tarjetas = driver.find_elements(By.CSS_SELECTOR, "a.group.block[href*='/dashboard/invitaciones/']")
    tarjetas = [t for t in tarjetas if not t.get_attribute("href").rstrip("/").endswith("/nueva")]

    if not tarjetas:
        print("  -> No se encontraron tarjetas de eventos. Verifica que el login haya funcionado")
        print("     y que existan eventos creados en la cuenta.")
        return []

    patron_fecha = re.compile(r"^\d{1,2}\s+[A-ZÁÉÍÓÚ]{3,4},\s*\d{4}$")
    registros = []

    for t in tarjetas:
        href = t.get_attribute("href")
        event_id = href.rstrip("/").split("/")[-1]

        try:
            titulo = t.find_element(By.TAG_NAME, "h3").text.strip()
        except Exception:
            titulo = None

        parrafos = [p.text.strip() for p in t.find_elements(By.TAG_NAME, "p") if p.text.strip()]
        # Orden esperado: [descripción?], ubicación, "Código", accessCode
        descripcion = ubicacion = codigo = None
        if len(parrafos) >= 4:
            descripcion, ubicacion, _, codigo = parrafos[0], parrafos[1], parrafos[2], parrafos[3]
        elif len(parrafos) == 3:
            ubicacion, _, codigo = parrafos
        elif len(parrafos) == 2:
            ubicacion, codigo = parrafos[0], None

        spans = [s.text.strip() for s in t.find_elements(By.TAG_NAME, "span") if s.text.strip()]
        fecha_txt = categoria = None
        for s in spans:
            if patron_fecha.match(s):
                fecha_txt = s
            elif "foto" in s.lower():
                continue  # "0 fotos" está hardcodeado en la UI, no es un dato real: se ignora
            elif categoria is None:
                categoria = s

        registros.append({
            "id": event_id,
            "titulo": titulo,
            "descripcion": descripcion,
            "ubicacion": ubicacion,
            "fecha_raw": fecha_txt,
            "categoria": categoria,
            "codigo": codigo,
        })

    print(f"  -> {len(registros)} evento(s) extraído(s).")
    return registros


def procesar_con_pandas(registros):
    print("\n[PASO 5] Estructurando y limpiando datos con Pandas...")

    df = pd.DataFrame(registros)
    if df.empty:
        print("  -> DataFrame vacío, nada que procesar.")
        return df

    # --- Limpieza de texto ---
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"": None, "None": None, "nan": None})

    # --- Formateo de fecha: "15 OCT, 2026" -> 2026-10-15 ---
    def parsear_fecha(txt):
        if not txt:
            return None
        m = re.match(r"(\d{1,2})\s+([A-ZÁÉÍÓÚ]{3,4}),\s*(\d{4})", txt)
        if not m:
            return None
        dia, mes_abbr, anio = m.groups()
        mes = MESES_ES.get(mes_abbr[:3])
        if not mes:
            return None
        try:
            return pd.Timestamp(year=int(anio), month=mes, day=int(dia)).strftime("%Y-%m-%d")
        except ValueError:
            return None

    df["fecha"] = df["fecha_raw"].apply(parsear_fecha)

    df = df.drop(columns=["fecha_raw"])
    df = df.dropna(how="all", subset=[c for c in df.columns if c != "id"])
    df = df.reset_index(drop=True)
    return df


def main():
    print("=" * 62)
    print("EXTRACCIÓN Y LIMPIEZA DE DATOS - AFTER-REWIND / Mis Eventos")
    print(f"Objetivo: {BASE}")
    print("=" * 62)

    driver = crear_driver()
    try:
        driver.get(BASE)
        WebDriverWait(driver, 15).until(lambda d: d.execute_script("return document.readyState") == "complete")

        resolver_captcha(driver)
        pausa_login_manual(driver)
        ir_a_mis_eventos(driver)
        registros = extraer_eventos(driver)
        df = procesar_con_pandas(registros)

        print("\n" + "=" * 62)
        print("TABLA DE DATOS PROCESADOS")
        print("=" * 62)
        if df.empty:
            print("(sin datos para mostrar)")
        else:
            with pd.option_context("display.max_columns", None, "display.width", 140):
                print(df)
            salida_csv = "eventos_procesados.csv"
            df.to_csv(salida_csv, index=False, encoding="utf-8-sig")
            print(f"\nGuardado como respaldo en: {salida_csv}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()