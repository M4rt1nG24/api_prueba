import requests
import time

# ==========================
# CONFIGURACIÓN
# ==========================
API_URL = "https://api-prueba-2-r35v.onrender.com"  # <- reemplaza con tu URL real
INTERVALO = 120  # tiempo entre pings en segundos (600 s = 10 min)

# ==========================
# BUCLE PRINCIPAL
# ==========================
print(f"Iniciando pings a {API_URL} cada {INTERVALO/60} minutos...")

while True:
    try:
        respuesta = requests.get(API_URL)
        if respuesta.status_code == 200:
            print(f"Ping exitoso ✔ - Status: {respuesta.status_code}")
        else:
            print(f"Ping realizado ⚠ - Status: {respuesta.status_code}")
    except Exception as e:
        print(f"Error al hacer ping: {e}")
    
    time.sleep(INTERVALO)
