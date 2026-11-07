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

// BUSCADOR TERRITORIAL DE COLOMBIA

const campoBusqueda = document.getElementById("buscar-municipio");
const resultadosBusqueda = document.getElementById("resultados-busqueda");
const fichaTerritorial = document.getElementById("ficha-territorial");

let municipiosBusqueda = [];
let municipioResaltado = null;

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function mostrarFichaMunicipal(info) {
    fichaTerritorial.replaceChildren();

    const titulo = document.createElement("h3");
    titulo.textContent = info.mpio_nombre || "Municipio";

    fichaTerritorial.appendChild(titulo);

    const campos = [
        ["Departamento", info.dpto_nombre],
        ["Código DIVIPOLA", info.divipola_mun],
        [
            "Área registrada",
            info.area_km2 != null
                ? Number(info.area_km2).toLocaleString("es-CO", {
                    maximumFractionDigits: 2
                }) + " km²"
                : "Sin dato"
        ]
    ];

    campos.forEach(([etiqueta, valor]) => {
        const parrafo = document.createElement("p");
        const negrita = document.createElement("strong");

        negrita.textContent = etiqueta + ": ";
        parrafo.append(negrita, document.createTextNode(valor ?? "Sin dato"));

        fichaTerritorial.appendChild(parrafo);
    });
}

function seleccionarMunicipio(feature) {
    if (municipioResaltado) {
        mapa.removeLayer(municipioResaltado);
    }

    municipioResaltado = L.geoJSON(feature, {
        style: {
            color: "#e87920",
            weight: 3,
            fillColor: "#f59e0b",
            fillOpacity: 0.22
        }
    }).addTo(mapa);

    mapa.fitBounds(municipioResaltado.getBounds(), {
        padding: [35, 35],
        maxZoom: 11
    });

    mostrarFichaMunicipal(feature.properties);
    resultadosBusqueda.replaceChildren();

    campoBusqueda.value = feature.properties.mpio_nombre || "";
}

function buscarMunicipios() {
    resultadosBusqueda.replaceChildren();

    const texto = normalizarTexto(campoBusqueda.value);

    if (texto.length < 2) {
        return;
    }

    const encontrados = municipiosBusqueda
        .filter(feature =>
            normalizarTexto(feature.properties?.mpio_nombre).includes(texto)
        )
        .slice(0, 12);

    if (encontrados.length === 0) {
        resultadosBusqueda.textContent = "No se encontraron municipios.";
        return;
    }

    encontrados.forEach(feature => {
        const info = feature.properties;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "resultado-municipio";

        boton.textContent =
            (info.mpio_nombre || "Municipio") +
            " — " +
            (info.dpto_nombre || "Departamento");

        boton.addEventListener("click", () => {
            seleccionarMunicipio(feature);
        });

        resultadosBusqueda.appendChild(boton);
    });
}

campoBusqueda.addEventListener("input", buscarMunicipios);

fetch("../data/municipios_colombia.geojson")
    .then(respuesta => {
        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el GeoJSON municipal.");
        }
        return respuesta.json();
    })
    .then(datos => {
        municipiosBusqueda = datos.features || [];

        console.log(
            "Municipios disponibles para búsqueda:",
            municipiosBusqueda.length
        );
    })
    .catch(error => {
        console.error("Error cargando municipios:", error);
        resultadosBusqueda.textContent =
            "No fue posible cargar el buscador municipal.";
    });

