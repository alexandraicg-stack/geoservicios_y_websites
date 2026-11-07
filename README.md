# GeoServicios y Websites

**Infraestructura de servicios geoespaciales y desarrollo de un visor territorial interactivo para Colombia**

**Autora:** Jenifer Alexandra Huertas López  
**Actualización documental:** 7 de noviembre de 2026  
**Proyecto académico:** prácticas de servicios SIG y Capítulo 11 — Aplicación Web con Leaflet.

[![Abrir visor](https://img.shields.io/badge/Abrir-Visor%20Territorial-2d7d68?style=for-the-badge)](https://alexandraicg-stack.github.io/geoservicios_y_websites/visor/) [![Documentación técnica](https://img.shields.io/badge/Leer-Documentaci%C3%B3n%20del%20visor-486ca9?style=for-the-badge)](visor/README.md)

## Presentación

Este repositorio reúne las prácticas de configuración de servicios geoespaciales y la implementación progresiva del **Visor Territorial de Colombia**. Integra un entorno SIG local, desarrollado con Docker, PostgreSQL/PostGIS, GeoServer y pg_tileserv, y una aplicación cartográfica web construida con Leaflet, HTML, CSS y JavaScript, publicada en GitHub Pages.

La aplicación pública permite consultar información territorial departamental y municipal de Colombia e incorpora una capa temática de **bibliotecas de Santiago de Cali** consumida desde servicios **WMS y WFS** de la Infraestructura de Datos Espaciales de Santiago de Cali (IDESC).

> **Distinción esencial:** en GitHub Pages, las capas de departamentos y municipios se leen desde archivos GeoJSON. Los servicios WMS/WFS de esas capas corresponden al **entorno local**, mientras que el WMS/WFS público integrado en el visor corresponde a **bibliotecas de Cali**. GitHub Pages no aloja GeoServer ni PostGIS.

## Accesos rápidos

| Recurso | Enlace |
|---|---|
| Visor público | [Abrir Visor Territorial de Colombia](https://alexandraicg-stack.github.io/geoservicios_y_websites/visor/) |
| Documentación técnica completa | [README del visor](visor/README.md) |
| Código de entrada | [`visor/index.html`](visor/index.html) |
| Evidencias históricas | [Carpeta `evidencias/`](evidencias/) |
| Repositorio | [geoservicios_y_websites](https://github.com/alexandraicg-stack/geoservicios_y_websites) |

## Funcionalidades del visor público

- Visualización de límites **departamentales y municipales** sobre OpenStreetMap.
- Activación y desactivación de capas desde el control cartográfico.
- Búsqueda de municipios por nombre y filtro por departamento.
- Consulta de atributos y ficha territorial mediante ventanas emergentes y panel lateral.
- Leyenda cartográfica y estadísticas de cobertura de los datos cargados.
- Interfaz adaptable con menú de consultas en pantallas móviles.
- Incorporación de bibliotecas de Cali con **WMS** para visualización y **WFS** para consulta de geometrías y atributos.

### Datos observados durante las pruebas

| Conjunto | Resultado registrado |
|---|---:|
| Municipios disponibles para búsqueda | 1.122 registros |
| Entidades de la capa departamental | 33 |
| Bibliotecas de Cali consultadas por WFS | 63 entidades |

Los conteos son resultados del ejercicio y de las pruebas registradas el **7 de noviembre de 2026**; no deben interpretarse como inventarios oficiales vigentes ni como disponibilidad garantizada del servicio externo.

## Arquitectura técnica

| Componente | Entorno local de prácticas | Aplicación pública |
|---|---|---|
| PostgreSQL / PostGIS | Almacenamiento espacial y consultas | No alojado en GitHub Pages |
| GeoServer | Publicación y prueba de WMS/WFS de capas territoriales | Consumo de GeoServer externo de IDESC Cali |
| pg_tileserv | Publicación y exploración de teselas vectoriales | No es requisito para abrir el visor público |
| Leaflet | Desarrollo y pruebas | Renderizado y controles interactivos |
| Departamentos y municipios | Capas SIG locales | Archivos GeoJSON del repositorio |
| Bibliotecas de Cali | Integración y pruebas de servicios OGC | WMS/WFS institucional por HTTPS |
| GitHub Pages | — | Alojamiento estático de la aplicación |

La capa institucional utilizada es `cultura:pbic_inc_bibliotecas`, publicada por IDESC Cali mediante:

- WMS: `https://ws-idesc.cali.gov.co/geoserver/wms`
- WFS: `https://ws-idesc.cali.gov.co/geoserver/wfs`

El WMS representa la información y el WFS permite recuperar entidades y atributos. La consulta WFS registrada devolvió 63 entidades; esa cantidad puede variar con las actualizaciones institucionales.

## Estructura principal

```text
geoservicios_y_websites/
├── README.md                         # Presentación general del proyecto
├── data/
│   ├── departamentos.geojson
│   └── municipios_colombia.geojson
├── visor/
│   ├── index.html                    # Aplicación pública
│   ├── README.md                     # Documentación técnica detallada
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── bibliotecas-cali.js
└── evidencias/                       # Capturas históricas del desarrollo
```

Esta vista presenta las rutas relevantes documentadas; no pretende ser un inventario exhaustivo del repositorio.

## Cómo utilizar el visor

1. Abre el [visor público](https://alexandraicg-stack.github.io/geoservicios_y_websites/visor/).
2. Utiliza el control de capas para mostrar **Departamentos**, **Municipios** y **Bibliotecas de Cali**.
3. Busca un municipio o filtra por departamento.
4. Selecciona un municipio para revisar su información territorial.
5. Acércate a Cali y selecciona una biblioteca para consultar sus atributos.
6. En dispositivos móviles, utiliza el menú de consultas para acceder al panel.

**No necesitas ejecutar Docker para abrir el visor público.** La capa de bibliotecas requiere conexión y disponibilidad del servicio externo de IDESC.

## Capítulo 10 — pygeoapi y servicios OGC API

El **Capítulo 10** aborda **pygeoapi**, un servidor Python para publicar y consultar información geoespacial mediante estándares modernos de **OGC API**. Se documenta como una práctica independiente de la aplicación Leaflet del Capítulo 11.

- **Guía académica:** [Capítulo 10 — pygeoapi (repositorio de epiragauta)](https://github.com/epiragauta/servicios_sig_y_websites/blob/main/taller/capitulo-10-pygeoapi.md).
- **Proyecto oficial:** [geopython/pygeoapi](https://github.com/geopython/pygeoapi).
- **Alcance por confirmar:** configuración local, colecciones publicadas, respuestas de la API y capturas de prueba. **La inclusión de esta referencia no significa que pygeoapi ya esté instalado, funcionando o validado en este repositorio.**

Para dar por terminado este capítulo se deberán conservar la configuración utilizada y evidencias reales de los endpoints de la instancia (`/`, `/collections` y, si aplica, `/collections/{collectionId}/items`), sin atribuir resultados que todavía no se hayan probado.

## Desarrollo y evidencias

El proyecto registra una evolución desde la nivelación con Git y Visual Studio Code hasta la configuración de contenedores, publicación local de datos y construcción del visor web.

Las imágenes conservadas en [`evidencias/`](evidencias/) documentan fases previas, entre ellas: contenedores Docker, revisión de 1.122 municipios en QGIS, catálogo de pg_tileserv, capas WMS de GeoServer, consultas GetFeatureInfo, filtros y búsquedas del visor en versiones anteriores. **Estas capturas son evidencia histórica y no deben confundirse con pruebas actuales de todos los componentes.**

Las comprobaciones finales descritas en la [documentación técnica del visor](visor/README.md) incluyen consulta WFS de bibliotecas, visualización WMS, respuestas del servidor, interacción con las capas nacionales y adaptación móvil. El README técnico distingue las pruebas observadas de las limitaciones de evidencia.

## Alcance y precauciones

- La versión pública es un sitio estático: no despliega servicios backend propios.
- Los GeoJSON nacionales utilizados deben acompañarse de su fuente original y condiciones de reutilización antes de presentarse como un inventario oficial definitivo.
- Los valores y geometrías del visor son orientativos para el ejercicio académico; no constituyen certificación catastral.
- Los servicios de IDESC pueden modificarse o estar temporalmente indisponibles.
- Los resultados de pruebas locales no garantizan que servicios locales estén disponibles públicamente.

## Créditos

**Desarrollo y documentación:** Jenifer Alexandra Huertas López.  
**Mapa base:** © colaboradores de OpenStreetMap.  
**Bibliotecas de Cali:** Infraestructura de Datos Espaciales de Santiago de Cali (IDESC), Alcaldía de Santiago de Cali.  
**Documentación complementaria:** [Visor Territorial de Colombia](visor/README.md).
