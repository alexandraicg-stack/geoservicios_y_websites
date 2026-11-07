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

// V5: GeoServer local y GeoJSON público (GitHub Pages).
// GitHub Pages no puede acceder a GeoServer instalado en otro computador.
const esVisorPublico = !["localhost", "127.0.0.1"].includes(window.location.hostname);
const urlWMS = "http://localhost:8082/geoserver/colombia_sig/wms";
let departamentos;
let municipios;

function mostrarPopupMunicipio(feature, latlng) {
    const info = feature.properties || {};
    const ficha = document.createElement("div");
    ficha.style.minWidth = "210px";
    const titulo = document.createElement("strong");
    titulo.textContent = info.mpio_nombre || "Municipio";
    ficha.appendChild(titulo);
    const detalles = [
        ["Departamento", info.dpto_nombre],
        ["Código DIVIPOLA", info.divipola_mun],
        ["Área registrada", info.area_km2 == null ? "Sin dato" :
            Number(info.area_km2).toLocaleString("es-CO", {maximumFractionDigits: 2}) + " km²"]
    ];
    detalles.forEach(([etiqueta, valor]) => {
        const linea = document.createElement("p");
        linea.textContent = etiqueta + ": " + (valor ?? "Sin dato");
        ficha.appendChild(linea);
    });
    L.popup().setLatLng(latlng).setContent(ficha).openOn(mapa);
    mostrarFichaMunicipal(info);
}

if (esVisorPublico) {
    // Capas vectoriales; los datos se cargan desde archivos públicos HTTPS.
    departamentos = L.geoJSON(null, {
        style: {color: "#214f81", weight: 2, fillOpacity: 0, opacity: 0.85}
    }).addTo(mapa);
    municipios = L.geoJSON(null, {
        style: {color: "#7597b5", weight: 1, fillOpacity: 0, opacity: 0.8},
        onEachFeature: (feature, layer) => {
            layer.on("click", event => {
                // Evitar el error GetFeatureInfo de localhost en GitHub Pages.
                mostrarPopupMunicipio(feature, event.latlng);
            });
        }
    });
    fetch("../data/departamentos.geojson")
        .then(r => {
            if (!r.ok) throw new Error("Departamentos HTTP " + r.status);
            return r.json();
        })
        .then(datos => {
            departamentos.addData(datos);
            console.log("Departamentos públicos cargados:", datos.features.length);
        })
        .catch(error => console.error("No se pudieron cargar departamentos:", error));
} else {
    departamentos = L.tileLayer.wms(urlWMS, {
        layers: "colombia_sig:departamentos_colombia",
        format: "image/png", transparent: true, version: "1.1.1", opacity: 0.65
    }).addTo(mapa);
    municipios = L.tileLayer.wms(urlWMS, {
        layers: "colombia_sig:Municipios",
        format: "image/png", transparent: true, version: "1.1.1", opacity: 0.75
    });
}

L.control.layers(
    {"OpenStreetMap": osm},
    {"Departamentos": departamentos, "Municipios": municipios},
    {collapsed: false, position: "topright"}
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
    if (esVisorPublico) return; // La consulta pública se resuelve sobre los polígonos GeoJSON.

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

async function seleccionarMunicipio(feature) {

    // En modo local consumimos WFS; en GitHub Pages usamos el GeoJSON alojado en HTTPS.
    if (!esVisorPublico) try {
        const codigo = feature.properties.divipola_mun;

        const featureWFS = await consultarMunicipioWFS(codigo);

        feature = featureWFS;

        console.log(
            "Municipio recuperado desde WFS:",
            feature.properties.mpio_nombre
        );

    } catch (error) {
        console.warn(
            "WFS no disponible. Se utiliza el GeoJSON local.",
            error
        );
    }
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
        .filter(feature => (!filtroDepartamento.value || String(feature.properties?.divipola_dep || "").padStart(2, "0") === filtroDepartamento.value) &&
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
        if (esVisorPublico) {
            municipios.addData(datos);
            console.log("Municipios públicos cargados:", municipiosBusqueda.length);
        }
        inicializarFiltroDepartamentos();

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



// FILTRO DEPARTAMENTAL V3

const filtroDepartamento = document.getElementById("filtro-departamento");
const estadisticas = document.getElementById("estadisticas-territoriales");

function codigoDepartamento(info) {
    return String(info.divipola_dep || "").padStart(2, "0");
}

function mostrarEstadisticas() {
    const codigo = filtroDepartamento.value;

    const seleccion = municipiosBusqueda.filter(feature =>
        !codigo || codigoDepartamento(feature.properties) === codigo
    );

    const areaTotal = seleccion.reduce((suma, feature) => {
        return suma + (Number(feature.properties?.area_km2) || 0);
    }, 0);

    estadisticas.replaceChildren();

    const titulo = document.createElement("h3");
    titulo.textContent = codigo
        ? filtroDepartamento.options[filtroDepartamento.selectedIndex].text
        : "Cobertura nacional";

    const cantidad = document.createElement("p");
    cantidad.textContent = "Registros municipales: " + seleccion.length;

    const area = document.createElement("p");
    area.textContent = "Suma de areas registradas: " +
        areaTotal.toLocaleString("es-CO", {
            maximumFractionDigits: 2
        }) + " km²";

    estadisticas.append(titulo, cantidad, area);
}

function inicializarFiltroDepartamentos() {
    const departamentos = new Map();

    municipiosBusqueda.forEach(feature => {
        const info = feature.properties || {};
        const codigo = codigoDepartamento(info);

        if (codigo && info.dpto_nombre) {
            departamentos.set(codigo, info.dpto_nombre);
        }
    });

    [...departamentos.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "es"))
        .forEach(([codigo, nombre]) => {
            const opcion = document.createElement("option");
            opcion.value = codigo;
            opcion.textContent = nombre;
            filtroDepartamento.appendChild(opcion);
        });

    mostrarEstadisticas();
}

filtroDepartamento.addEventListener("change", () => {
    campoBusqueda.value = "";
    resultadosBusqueda.replaceChildren();
    mostrarEstadisticas();
});

// ZOOM AUTOMATICO POR DEPARTAMENTO
filtroDepartamento.addEventListener("change", () => {

    const codigo = filtroDepartamento.value;

    if (municipioResaltado) {
        mapa.removeLayer(municipioResaltado);
        municipioResaltado = null;
    }

    if (!codigo) {
        mapa.setView([4.5, -74.5], 6);
        return;
    }

    const seleccion = municipiosBusqueda.filter(feature =>
        codigoDepartamento(feature.properties || {}) === codigo
    );

    if (seleccion.length === 0) {
        return;
    }

    const limites = L.geoJSON({
        type: "FeatureCollection",
        features: seleccion
    }).getBounds();

    if (limites.isValid()) {
        mapa.fitBounds(limites, {
            padding: [30, 30],
            maxZoom: 10
        });
    }
});


// LIMPIAR FICHA AL CAMBIAR DE DEPARTAMENTO
filtroDepartamento.addEventListener("change", () => {
    fichaTerritorial.replaceChildren();

    const titulo = document.createElement("h3");
    titulo.textContent = "Información municipal";

    const mensaje = document.createElement("p");
    mensaje.textContent =
        "Selecciona un municipio del departamento para consultar sus datos.";

    fichaTerritorial.append(titulo, mensaje);
});

// CONSULTA WFS MUNICIPAL V4
async function consultarMunicipioWFS(codigoDivipola) {

    const parametros = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeNames: "colombia_sig:Municipios",
        outputFormat: "application/json",
        count: "1",
        CQL_FILTER: "divipola_mun='" +
            String(codigoDivipola).replace(/'/g, "''") + "'"
    });

    const url = "http://localhost:8082/geoserver/colombia_sig/ows?"
        + parametros.toString();

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("Error WFS: HTTP " + respuesta.status);
    }

    const datos = await respuesta.json();

    if (!datos.features || datos.features.length === 0) {
        throw new Error("Municipio no encontrado mediante WFS.");
    }

    return datos.features[0];
}


// LEYENDA CARTOGRAFICA V4
const leyendaCartografica = L.control({
    position: "bottomright"
});

leyendaCartografica.onAdd = function () {
    const div = L.DomUtil.create("div", "leyenda-territorial");

    div.style.cssText = `
        background: rgba(255,255,255,0.96);
        padding: 12px 15px;
        border: 1px solid #d7e1ea;
        border-radius: 9px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.9;
        color: #18365d;
    `;

    div.innerHTML = `
        <div style="font-weight:bold;font-size:13px;margin-bottom:5px">
            Convenciones
        </div>
        <div>
            <span style="display:inline-block;width:24px;border-top:3px solid #e87920;vertical-align:middle;margin-right:8px"></span>
            Municipio seleccionado
        </div>
        <div>
            <span style="display:inline-block;width:24px;border-top:2px solid #214f81;vertical-align:middle;margin-right:8px"></span>
            Límites departamentales
        </div>
        <div>
            <span style="display:inline-block;width:24px;border-top:1px dashed #7597b5;vertical-align:middle;margin-right:8px"></span>
            Límites municipales
        </div>
    `;

    L.DomEvent.disableClickPropagation(div);

    return div;
};

leyendaCartografica.addTo(mapa);

// MENU RESPONSIVE V4: abre y cierra el panel en pantallas pequeñas.
const botonMenu = document.getElementById("boton-menu");
const panelTerritorial = document.getElementById("panel-territorial");
if (botonMenu && panelTerritorial) {
    botonMenu.addEventListener("click", () => {
        const abierto = panelTerritorial.classList.toggle("panel-abierto");
        botonMenu.setAttribute("aria-expanded", String(abierto));
        botonMenu.textContent = abierto ? "✕ Cerrar consultas" : "☰ Consultas";
        window.setTimeout(() => mapa.invalidateSize(), 150);
    });
}
