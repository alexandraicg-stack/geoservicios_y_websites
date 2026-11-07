// INTEGRACION INSTITUCIONAL WMS/WFS - IDESC CALI
// Fuente: GeoServer de Santiago de Cali

const urlGeoServerCali =
    "https://ws-idesc.cali.gov.co/geoserver";

const capaBibliotecas =
    "cultura:pbic_inc_bibliotecas";

// Representacion cartografica mediante WMS
const bibliotecasWMS = L.tileLayer.wms(
    urlGeoServerCali + "/wms",
    {
        layers: capaBibliotecas,
        format: "image/png",
        transparent: true,
        version: "1.1.1",
        attribution: "IDESC - Alcaldia de Santiago de Cali"
    }
);

// Geometrias para consulta mediante WFS
const bibliotecasWFS = L.geoJSON(null, {
    style: {
        color: "#4C1D95",
        weight: 4,
        fillColor: "#6D28D9", fillOpacity: 0.75,
        opacity: 1
    },

    onEachFeature: function (feature, layer) {
        const info = feature.properties || {};

        const ficha = document.createElement("div");
        const titulo = document.createElement("strong");
        titulo.textContent = info.nombib || "Biblioteca";

        ficha.appendChild(titulo);

        [
            ["Barrio", info.barbib],
            ["Comuna", info.combib],
            ["Direccion", info.dirbib],
            ["Estado", info.estbib]
        ].forEach(function (campo) {
            const parrafo = document.createElement("p");
            parrafo.textContent =
                campo[0] + ": " + (campo[1] || "Sin dato");
            ficha.appendChild(parrafo);
        });

        layer.bindPopup(ficha);
    }
});

// Consultar las entidades mediante WFS
async function cargarBibliotecasCali() {
    const parametros = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeNames: capaBibliotecas,
        outputFormat: "application/json",
        srsName: "EPSG:4326",
        count: "100"
    });

    const respuesta = await fetch(
        urlGeoServerCali + "/wfs?" + parametros.toString()
    );

    if (!respuesta.ok) {
        throw new Error("WFS Cali: HTTP " + respuesta.status);
    }

    const datos = await respuesta.json();
    bibliotecasWFS.addData(datos);

    console.log(
        "Bibliotecas recibidas mediante WFS:",
        datos.features.length
    );
}

// Mostrar geometrías consultables cuando se activa el WMS
mapa.on("overlayadd", function (evento) {
    if (evento.layer === bibliotecasWMS) {
        bibliotecasWFS.addTo(mapa);
    }
});

mapa.on("overlayremove", function (evento) {
    if (evento.layer === bibliotecasWMS) {
        mapa.removeLayer(bibliotecasWFS);
    }
});

controlCapas.addOverlay(bibliotecasWMS, "Bibliotecas de Cali (WMS/WFS)");

// Descargar entidades WFS
cargarBibliotecasCali().catch(function (error) {
    console.error("Error cargando bibliotecas de Cali:", error);
});





// LEYENDA INSTITUCIONAL - BIBLIOTECAS DE CALI
function agregarBibliotecasALeyenda() {
    const leyenda = document.querySelector(".leyenda-territorial");

    if (!leyenda || document.getElementById("leyenda-bibliotecas-cali")) {
        return;
    }

    const fila = document.createElement("div");
    fila.id = "leyenda-bibliotecas-cali";
    fila.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:5px;";

    const simbolo = document.createElement("span");
    simbolo.style.cssText = `
        display:inline-block;
        width:24px;
        height:12px;
        background:#6D28D9;
        border:2px solid #4C1D95;
        border-radius:3px;
        box-sizing:border-box;
        flex-shrink:0;
    `;

    const texto = document.createElement("span");
    texto.textContent = "Bibliotecas de Cali";

    fila.append(simbolo, texto);
    leyenda.appendChild(fila);
}

agregarBibliotecasALeyenda();

// PRIORIDAD DE CONSULTA: BIBLIOTECAS SOBRE MUNICIPIOS
function priorizarBibliotecasCali() {
    if (mapa.hasLayer(municipios) && typeof municipios.bringToBack === "function") {
        municipios.bringToBack();
    }

    if (mapa.hasLayer(bibliotecasWFS)) {
        bibliotecasWFS.bringToFront();
    }
}

mapa.on("overlayadd", priorizarBibliotecasCali);
mapa.on("overlayremove", priorizarBibliotecasCali);

priorizarBibliotecasCali();

// PRIORIDAD DE CONSULTA: BIBLIOTECAS SOBRE MUNICIPIOS
function priorizarBibliotecasCali() {
    if (mapa.hasLayer(municipios) && typeof municipios.bringToBack === "function") {
        municipios.bringToBack();
    }

    if (mapa.hasLayer(bibliotecasWFS)) {
        bibliotecasWFS.bringToFront();
    }
}

mapa.on("overlayadd", priorizarBibliotecasCali);
mapa.on("overlayremove", priorizarBibliotecasCali);

priorizarBibliotecasCali();
