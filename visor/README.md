# Visor Territorial de Colombia

**Aplicación web de consulta territorial con Leaflet, GeoServer y servicios geoespaciales OGC**

[**Abrir visor público**](https://alexandraicg-stack.github.io/geoservicios_y_websites/visor/) · [**Repositorio de GitHub**](https://github.com/alexandraicg-stack/geoservicios_y_websites)

## 1. Descripción del proyecto

El **Visor Territorial de Colombia** es una aplicación web de cartografía interactiva desarrollada con **Leaflet**, orientada a la visualización y consulta de información territorial de Colombia. Integra límites departamentales y municipales, búsqueda y filtrado territorial, consulta de atributos y una capa temática de bibliotecas de Santiago de Cali publicada por la **Infraestructura de Datos Espaciales de Santiago de Cali (IDESC)** a través de **GeoServer**.

La aplicación tiene una versión pública alojada en **GitHub Pages** y una configuración local de servicios SIG. La arquitectura distingue expresamente las fuentes y los protocolos empleados en cada entorno.

Este trabajo se desarrolló en el marco del **capítulo 11: Aplicación Web con Leaflet**, como ejercicio de integración de datos geográficos, servicios OGC y publicación web.

## 2. Acceso

- **Visor público:** https://alexandraicg-stack.github.io/geoservicios_y_websites/visor/
- **Código fuente:** https://github.com/alexandraicg-stack/geoservicios_y_websites
- **Entrada de la aplicación:** `visor/index.html`

El visor público no requiere iniciar los contenedores locales para visualizar las capas nacionales ni para consumir los servicios públicos de IDESC Cali. **La disponibilidad de las bibliotecas depende de la continuidad y accesibilidad del servidor externo de IDESC.**

## 3. Funcionalidades implementadas

| Funcionalidad | Descripción |
|---|---|
| Visualización territorial | Límites de departamentos y municipios sobre OpenStreetMap. |
| Control de capas | Activación y desactivación de Departamentos, Municipios y Bibliotecas de Cali. |
| Consulta espacial | Ventanas emergentes con datos del municipio o de una biblioteca seleccionada. |
| Búsqueda municipal | Búsqueda por nombre entre los registros municipales cargados. |
| Filtro departamental | Selección de departamento para acotar las consultas territoriales. |
| Información y estadísticas | Panel lateral con información del municipio y resumen de cobertura. |
| Leyenda cartográfica | Convenciones para municipio seleccionado, límites departamentales, límites municipales y bibliotecas. |
| Diseño adaptable | Interfaz con menú de consultas para pantallas móviles. |
| Servicios OGC | Visualización por WMS y recuperación de entidades por WFS para bibliotecas de Cali. |
| Publicación web | Aplicación estática publicada en GitHub Pages mediante HTTPS. |

En las pruebas de funcionamiento realizadas durante el desarrollo se consultaron **1.122 registros municipales**, **33 entidades en la capa departamental** y **63 entidades WFS de bibliotecas de Cali**. Estas cantidades corresponden a los conjuntos y respuestas utilizados en el ejercicio y pueden cambiar si cambian las fuentes.

## 4. Arquitectura y fuentes de datos

### 4.1. Versión pública (GitHub Pages)

| Información | Fuente / mecanismo | Uso |
|---|---|---|
| Departamentos | Archivo `data/departamentos.geojson` del repositorio | Dibujo de límites nacionales. |
| Municipios | Archivo `data/municipios_colombia.geojson` del repositorio | Dibujo, búsqueda y consulta de atributos municipales. |
| Bibliotecas de Cali | GeoServer de IDESC Cali mediante **WMS** | Representación cartográfica de las entidades. |
| Bibliotecas de Cali | GeoServer de IDESC Cali mediante **WFS**, respuesta GeoJSON | Geometrías interactivas y consulta de atributos. |
| Mapa base | OpenStreetMap, mostrado con Leaflet | Referencia cartográfica. |

**Precisiones técnicas:** En la versión **pública**, los departamentos y municipios se cargan desde archivos **GeoJSON**, no desde el GeoServer local. En cambio, la capa de **Bibliotecas de Cali** sí consume **WMS y WFS** de un GeoServer institucional accesible por HTTPS. No debe afirmarse que los límites nacionales se consumen por WMS/WFS desde GitHub Pages.

### 4.2. Entorno local de prácticas SIG

El proyecto también ha utilizado contenedores Docker con **PostGIS**, **GeoServer** y **pg_tileserv** para las prácticas de servicios geoespaciales. En el entorno local del desarrollo, GeoServer publica capas del espacio de trabajo `colombia_sig`, entre ellas departamentos y municipios. En la configuración utilizada, el acceso local a GeoServer se realiza por el puerto **8082**.

El visor distingue el entorno local del público. Los recursos `localhost` **no son accesibles para otras personas** al abrir GitHub Pages; por ello las capas nacionales de la versión pública se sirven como GeoJSON y las bibliotecas se consultan desde un servidor institucional externo.

## 5. Servicios WMS y WFS de IDESC Cali

- **GeoServer:** `https://ws-idesc.cali.gov.co/geoserver`
- **WMS:** `https://ws-idesc.cali.gov.co/geoserver/wms`
- **WFS:** `https://ws-idesc.cali.gov.co/geoserver/wfs`
- **Nombre de la capa:** `cultura:pbic_inc_bibliotecas`
- **Tipo de geometría observado:** `MultiPolygon`.

### WMS: visualización

La aplicación incorpora la capa institucional utilizando `L.tileLayer.wms(...)` con imágenes PNG transparentes. Se comprobó que la capa WMS permanecía visible después de retirar temporalmente la capa interactiva WFS durante las pruebas.

### WFS: consulta de entidades y atributos

La aplicación solicita `GetFeature` con salida `application/json` y utiliza Leaflet para presentar las geometrías y sus ventanas emergentes. Entre los atributos consultados están:

| Campo | Contenido |
|---|---|
| `nombib` | Nombre de la biblioteca. |
| `barbib` | Barrio. |
| `combib` | Comuna. |
| `dirbib` | Dirección. |
| `estbib` | Estado. |

Durante la validación realizada el **7 de noviembre de 2026**, la respuesta `GetFeature` devolvió entidades correctamente, `resultType=hits` informó **63 entidades** y el servidor respondió a la solicitud de navegador desde GitHub Pages. Se observó la cabecera `Access-Control-Allow-Origin: *` en la respuesta consultada.

**Advertencia:** Los servicios externos pueden cambiar, limitar solicitudes o presentar interrupciones; las cifras y disponibilidad documentadas son las observadas en las pruebas, no una garantía permanente.

## 6. Tecnologías

- **HTML5 y CSS3:** estructura, estilos e interfaz adaptable.
- **JavaScript:** interacción, búsqueda, filtrado y consultas de entidades.
- **Leaflet 1.9.4:** mapa interactivo, capas WMS, GeoJSON, controles y ventanas emergentes.
- **OpenStreetMap:** cartografía base.
- **GeoJSON:** distribución pública de límites nacionales y formato de respuesta WFS.
- **GeoServer:** publicación de servicios WMS/WFS en el entorno de prácticas y en el servidor de IDESC.
- **Docker / PostGIS / pg_tileserv:** infraestructura utilizada en las prácticas SIG locales.
- **GitHub Pages:** publicación de la aplicación web estática.

## 7. Estructura relevante del repositorio

```text
geoservicios_y_websites/
├── data/
│   ├── departamentos.geojson
│   └── municipios_colombia.geojson
├── visor/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   └── bibliotecas-cali.js
│   └── README.md              # Este documento, al incorporarlo
└── evidencias/               # Capturas de las prácticas, si se mantienen en el repositorio
```

La estructura anterior identifica los archivos relevantes del visor; no constituye un inventario exhaustivo de todo el repositorio.

## 8. Uso del visor

1. Abrir el [visor publicado](https://alexandraicg-stack.github.io/geoservicios_y_websites/visor/).
2. Activar o desactivar **Departamentos**, **Municipios** y **Bibliotecas de Cali (WMS/WFS)** en el control de capas.
3. Seleccionar un departamento o escribir el nombre de un municipio en el buscador para consultar información territorial.
4. Hacer clic en un polígono municipal para visualizar su ficha.
5. Acercarse a Santiago de Cali y hacer clic en una geometría violeta para ver los atributos de una biblioteca.
6. En dispositivos móviles, usar el botón de consultas para abrir o cerrar el panel lateral.

La capa departamental se configuró para no interceptar clics sobre las entidades municipales y bibliotecas, permitiendo mantener visibles las tres capas.

## 9. Pruebas funcionales realizadas

| Prueba | Resultado registrado durante el desarrollo |
|---|---|
| Carga de entidades municipales | 1.122 registros disponibles para búsqueda. |
| Carga departamental | 33 entidades reportadas por el visor. |
| WFS de Cali por `GetFeature` | Respuesta `FeatureCollection` y atributos consultables. |
| Conteo de bibliotecas por WFS | 63 entidades. |
| CORS desde GitHub Pages | Solicitud exitosa desde la consola del navegador. |
| WMS de bibliotecas | Representación confirmada al retirar temporalmente el WFS interactivo. |
| Ventanas emergentes | Consulta de ficha municipal y de biblioteca con capas visibles. |
| Control de capas y leyenda | Control unificado y simbología violeta agregada. |
| Diseño móvil | Panel y mapa observados en la versión pública en un ancho reducido. |

Para la entrega académica se recomienda adjuntar capturas con fecha o contexto visible de: **(1)** vista nacional con control y leyenda, **(2)** selección municipal y ficha, **(3)** bibliotecas y ficha de atributos, **(4)** consola con carga WFS, **(5)** vista móvil y **(6)** repositorio o enlace publicado. No se incluyen capturas en este archivo; deben incorporarse únicamente imágenes realmente obtenidas durante las pruebas.

## 10. Alcance y limitaciones

- La publicación en GitHub Pages es **estática**. No aloja GeoServer, PostGIS ni servicios propios de backend.
- Los **límites nacionales** de GitHub Pages se consultan mediante **GeoJSON**; el WMS/WFS nacional del entorno local no está publicado automáticamente en internet.
- Los **WMS/WFS públicos** integrados corresponden a **bibliotecas de Cali** y dependen de IDESC.
- Los valores de área de la capa municipal deben interpretarse conforme al conjunto GeoJSON utilizado; **no deben presentarse como certificación catastral oficial**.
- La app es un ejercicio académico de integración geoespacial y no reemplaza las fuentes oficiales para decisiones administrativas o jurídicas.

## 11. Entrega académica

**Capítulo:** 11 — Aplicación Web con Leaflet.

**Producto:** Visor Territorial de Colombia disponible en línea, con datos nacionales, consulta de atributos, controles cartográficos, diseño adaptable y consumo de servicios WMS/WFS institucionales.

**Elementos a entregar o referenciar:**

- Enlace funcional al visor publicado.
- Enlace al repositorio de código.
- README técnico con alcance y arquitectura.
- Evidencias reales de visualización, consultas WMS/WFS y experiencia móvil.

---

**Créditos de información:** capas y datos utilizados en la práctica; IDESC – Alcaldía de Santiago de Cali para el servicio institucional de bibliotecas; OpenStreetMap para el mapa base. La procedencia específica de los GeoJSON nacionales debe completarse con la fuente de origen y su licencia antes de presentar el informe como inventario de datos definitivo.
