"""
bot_ui.py - Bot Selenium que intenta enviar el formulario de login local

Complemento de la demo: en lugar de pegarle a la API, el bot navega con un
navegador automatizado a /login, llena correo y contraseña y presiona
"Iniciar Sesión" SIN resolver el slider puzzle.

El formulario (cliente) y el servidor (rate limiting + bloqueo por fallos)
impiden el envío: el bot no avanza al dashboard.

Uso:
  python bot_ui.py [url]
  (url por defecto: http://localhost:3000)
"""
import os
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# Consola de Windows: forzar UTF-8 para ver bien los acentos
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")
LOGIN = f"{URL}/login"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

options = webdriver.ChromeOptions()
options.add_argument("--window-size=1280,800")
options.add_argument("--headless=new")  # quita esta línea para ver el navegador

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

try:
    print(f"Navegando a {LOGIN} ...")
    driver.get(LOGIN)
    time.sleep(3)

    # 1. Llenar el formulario como cualquier script lo haría
    email = driver.find_element(By.ID, "email")
    email.send_keys("bot@malicioso.com")

    password = driver.find_element(By.ID, "password")
    password.send_keys("contrasena_insegura_123")

    print("Formulario llenado. Intentando enviar...")

    # 2. Enviar el formulario sin resolver el captcha
    boton = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    habilitado = boton.is_enabled()
    boton.click()
    time.sleep(2)

    # 3. Comprobar la respuesta del servidor/aplicación
    url_final = driver.current_url
    page = driver.page_source
    error = "Resuelve el desafío" in page or "Desafío de seguridad incorrecto" in page
    en_dashboard = "/dashboard" in url_final

    print("-" * 55)
    print(f"  Botón de envío habilitado? : {'SI' if habilitado else 'NO (deshabilitado hasta resolver captcha)'}")
    print(f"  URL final del bot          : {url_final}")
    print(f"  ¿Mostró error de captcha?  : {'SI' if error else 'no'}")
    print(f"  ¿Llegó al dashboard?       : {'SI' if en_dashboard else 'NO (bloqueado)'}")
    print("-" * 55)

    driver.save_screenshot(os.path.join(SCRIPT_DIR, "bot_ui.png"))
    print("Captura guardada en selenium-bot/bot_ui.png")

    if en_dashboard:
        print("¡OJO! El bot logró entrar. Revisa las protecciones.")
    else:
        print("Resultado: el servidor/aplicación BLOQUEÓ al bot en el formulario local.")
finally:
    driver.quit()