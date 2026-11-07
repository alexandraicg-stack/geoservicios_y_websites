import json
from pathlib import Path

archivo = Path("data/departamentos.geojson")

with archivo.open("r", encoding="utf-8-sig") as f:
    datos = json.load(f)

print("Tipo de archivo:", datos.get("type"))
print("Total de entidades:", len(datos.get("features", [])))

if datos.get("features"):
    primero = datos["features"][0]
    print("Tipo de geometria:", primero.get("geometry", {}).get("type"))
    print("Campos disponibles:", list(primero.get("properties", {}).keys()))

print("VALIDACION FINALIZADA")
