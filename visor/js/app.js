const mapa = L.map("map", {
    center: [4.5, -74.5],
    zoom: 6,
    zoomControl: true
});

// Mapa base de OpenStreetMap
const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }
).addTo(mapa);

// Servicios WMS de nuestro GeoServer
const urlWMS = "http://localhost:8082/geoserver/colombia_sig/wms";

// Departamentos
const departamentos = L.tileLayer.wms(urlWMS, {
    layers: "colombia_sig:departamentos_colombia",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.65
}).addTo(mapa);

// Municipios
const municipios = L.tileLayer.wms(urlWMS, {
    layers: "colombia_sig:Municipios",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.75
});

// Control de capas
L.control.layers(
    {
        "OpenStreetMap": osm
    },
    {
        "Departamentos": departamentos,
        "Municipios": municipios
    },
    {
        collapsed: false,
        position: "topright"
    }
).addTo(mapa);

// Escala gráfica
L.control.scale({
    metric: true,
    imperial: false
}).addTo(mapa);

// Vista inicial de Colombia
mapa.setView([4.5, -74.5], 6);

console.log("Visor Territorial de Colombia iniciado");

// CONSULTA MUNICIPAL MEDIANTE WMS GETFEATUREINFO
mapa.on("click", async function (evento) {

    if (!mapa.hasLayer(municipios)) {
        L.popup()
            .setLatLng(evento.latlng)
            .setContent("Activa la capa Municipios para consultar información.")
            .openOn(mapa);
        return;
    }

    const limites = mapa.getBounds();
    const tamano = mapa.getSize();
    const pixel = mapa.latLngToContainerPoint(evento.latlng);

    const parametros = new URLSearchParams({
        service: "WMS",
        version: "1.1.1",
        request: "GetFeatureInfo",
        layers: "colombia_sig:Municipios",
        query_layers: "colombia_sig:Municipios",
        styles: "",
        bbox: [
            limites.getWest(),
            limites.getSouth(),
            limites.getEast(),
            limites.getNorth()
        ].join(","),
        srs: "EPSG:4326",
        width: tamano.x,
        height: tamano.y,
        x: Math.round(pixel.x),
        y: Math.round(pixel.y),
        info_format: "application/json",
        feature_count: 1
    });

    const url = urlWMS + "?" + parametros.toString();

    const popup = L.popup()
        .setLatLng(evento.latlng)
        .setContent("Consultando municipio...")
        .openOn(mapa);

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("HTTP " + respuesta.status);
        }

        const datos = await respuesta.json();

        if (!datos.features || datos.features.length === 0) {
            popup.setContent("No se encontró un municipio en este punto.");
            return;
        }

        const info = datos.features[0].properties;

        const ficha = document.createElement("div");
        ficha.style.minWidth = "230px";

        const titulo = document.createElement("h3");
        titulo.textContent = info.mpio_nombre || "Municipio sin nombre";
        titulo.style.margin = "0 0 8px";

        const detalle = document.createElement("div");

        const departamento = document.createElement("p");
        departamento.textContent = "Departamento: " + (info.dpto_nombre || "Sin dato");

        const codigo = document.createElement("p");
        codigo.textContent = "Código DIVIPOLA: " + (info.divipola_mun || "Sin dato");

        const area = document.createElement("p");
        area.textContent = "Área registrada: " +
            (info.area_km2 != null
                ? Number(info.area_km2).toLocaleString("es-CO", {
                    maximumFractionDigits: 2
                  }) + " km²"
                : "Sin dato");

        detalle.append(departamento, codigo, area);
        ficha.append(titulo, detalle);

        if (mapa.hasLayer(municipios) && mapa.hasLayer(departamentos)) {
            popup.setContent(ficha);
        } else if (mapa.hasLayer(municipios)) {
            popup.setContent(ficha);
        }

    } catch (error) {
        console.error("Error en GetFeatureInfo:", error);
        popup.setContent("No fue posible consultar el municipio.");
    }
});
