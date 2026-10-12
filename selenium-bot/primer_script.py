"""
primer_script.py - Primer script de Selenium (Verificación del entorno)

Objetivo del entregable:
  - Comprobar que el entorno de automatización quedó preparado:
      selenium + webdriver-manager + apertura del navegador automatizado.
  - Abre la landing local (http://localhost:3000), imprime título y URL,
    toma una captura de pantalla y cierra el navegador.

Uso:
  python primer_script.py [url]
  (url por defecto: http://localhost:3000)
"""
import os
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Consola de Windows: forzar UTF-8 para ver bien los acentos
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# webdriver-manager descarga el ChromeDriver acorde a la versión de Chrome instalada
options = webdriver.ChromeOptions()
options.add_argument("--window-size=1280,800")
options.add_argument("--headless=new")  # quita esta línea para ver el navegador

print("[1/4] Obteniendo ChromeDriver (webdriver-manager)...")
service = Service(ChromeDriverManager().install())

print("[2/4] Abriendo navegador automatizado...")
driver = webdriver.Chrome(service=service, options=options)

try:
    print(f"[3/4] Navegando a {URL} ...")
    driver.get(URL)
    time.sleep(3)  # dejamos que React hidrate el captcha

    title = driver.title
    url_actual = driver.current_url
    print(f"      -> Título de la página : {title!r}")
    print(f"      -> URL actual          : {url_actual}")

    driver.save_screenshot(os.path.join(SCRIPT_DIR, "primer_script.png"))
    print("      -> Captura guardada en selenium-bot/primer_script.png")

    html = driver.page_source
    tiene_gate = "VERIFICACIÓN" in html or "Desafío de seguridad" in html
    print(f"      -> ¿Muestra el CaptchaGate? : {'SI' if tiene_gate else 'no'}")
finally:
    print("[4/4] Cerrando navegador...")
    driver.quit()

print("Entorno de automatización OK.")