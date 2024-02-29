import { PUBLIC_URL_GSHEET_DOC } from "./env.js";
const mushroomIcon = `<svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g stroke="#141b34" stroke-width="1.5"><path d="m10.2762 13c1.7238 3-1.59775 4.3826-1.25054 6.2747.40638 2.2144 2.71374 3.3668 4.45384 2.3551 2.4672-1.4345 1.4153-6.8269.4322-8.6102" stroke-linecap="round"/><path d="m12.0153 2c-4.6724 0-8.47694 2.64819-8.99542 7.03138-.72522 6.13092 18.63482 4.43992 17.96302-.21245-.6145-4.25617-4.3711-6.81893-8.9676-6.81893z"/><path d="m16 6c1 0 2 1 2 2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
`;
const svgIcon = L.divIcon({
  html: mushroomIcon,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

let fetchedData = [];
let currentData = [];
let appliedFilters = [];
let groupLayers;

function filterPhysicalShop(data) {
  return data.filter((item) => item.has_physical_shop === true);
}

function filterShippingAllCountry(data) {
  return data.filter((item) => item.shipping_all_country === true);
}

function filterContactByWhatsapp(data) {
  return data.filter((item) => item.whatsapp === true);
}

const filters = {
  hasPhysicalShop: filterPhysicalShop,
  hasShippingAllCountry: filterShippingAllCountry,
  contactByWhatsapp: filterContactByWhatsapp,
};

const filterTranslate = {
  hasPhysicalShop: "Tiene tienda física",
  hasShippingAllCountry: "Envíos a todo el país",
  contactByWhatsapp: "Tiene Whatsapp",
};

/**
 * get element for marker
 */
function getMarker(data, map) {
  const {
    name,
    address,
    email,
    phone,
    description,
    facebook,
    linkedin,
    twitter,
    instagram,
    website,
    whatsapp: hasWhatsapp,
    shipping_all_country: hasShippingAllCountry,
    has_physical_shop: hasPhysicalShop,
    categories,
    youtube,
    lat,
    lng,
  } = data;
  let popupContent = `
    <div>
      <h3>${name}</h3>
  `;
  popupContent += address
    ? `
      <p><strong>Dirección:</strong> ${address}</p>`
    : "";
  popupContent += email
    ? `
      <p><strong>Email:</strong> ${email}</p>`
    : "";
  popupContent += phone
    ? `
      <p><strong>Teléfono:</strong> ${phone}</p>`
    : "";
  popupContent += description
    ? `
      <p><strong>Descripción:</strong> ${description}</p>`
    : "";
  popupContent += `
      <p><strong>Redes sociales:</strong></p>
      <ul>`;
  popupContent += facebook
    ? `<li><a href="https://www.facebook.com/${facebook}" target="_blank">Facebook</a></li>`
    : ``;
  popupContent += linkedin
    ? `<li><a href="https://linkedin.com/${linkedin}" target="_blank">LinkedIn</a></li>`
    : "";
  popupContent += twitter
    ? `<li><a href="https://x.com/${twitter}" target="_blank">Twitter</a></li>`
    : "";
  popupContent += youtube
    ? `<li><a href="https://youtube.com/' + ${youtube}'" target="_blank">Canal de Youtube</a></li>`
    : "";
  popupContent += instagram
    ? `<li><a href="https://instagram.com/${instagram}" target="_blank">Instagram @${instagram}</a></li></ul>`
    : "</ul>";

  popupContent += website
    ? `<p><strong>Sitio Web:</strong> <a href="${website}" target="_blank">${website}</a></p>`
    : "";
  popupContent += `
      <p><strong>¿Tiene WhatsApp?:</strong> ${hasWhatsapp ? "Sí" : "No"}</p>
      <p><strong>Envío a todos los países:</strong> ${
        hasShippingAllCountry ? "Sí" : "No"
      }</p>
      <p><strong>Tiene Tienda Física:</strong> ${
        hasPhysicalShop ? "Sí" : "No"
      }</p>
      <p><strong>Palabras relacionadas:</strong> ${categories}</p>
    </div>
  `;

  const marker = L.marker([lat, lng], {
    alt: name,
    icon: svgIcon,
  }).bindPopup(popupContent);
  marker.bindTooltip(`${name}`);
  //marker.bindTooltip(popupContent);
  //marker.on("mouseover", function (e) {
  //  console.log("is open", marker.isPopupOpen());
  //  if (!marker.isPopupOpen()) {
  //    console.log("entonces no lo abras");
  //    tooltip.openTooltip();
  //  }
  //});
  marker.on("click", function (e) {
    //tooltip.closeTooltip();
    map.setView(e.latlng, 13);
  });
  return marker;
}

/**
 * re-renderize map with filters (or without)
 */
function changeFilter(filterElement) {
  if (filterElement.checked && !appliedFilters.includes(filterElement.id)) {
    appliedFilters.push(filterElement.id);
    currentData = filters[filterElement.id](currentData);
  } else if (
    !filterElement.checked &&
    appliedFilters.includes(filterElement.id)
  ) {
    const indexToDelete = appliedFilters.indexOf(filterElement.id);
    appliedFilters.splice(indexToDelete, 1);
    let newData = fetchedData;
    if (appliedFilters.length > 0) {
      appliedFilters.forEach((filterKey) => {
        newData = filters[filterKey](newData);
      });
    }
    currentData = newData;
  }
  processMarkers(map, currentData);
}

/**
 * execute once, add filter list and event listener
 */

function addFilters(map) {
  var filtros = Object.keys(filters).reduce(
    (acc, key) => ({ ...acc, [filterTranslate[key]]: key }),
    {},
  );

  var filterLayer = L.Control.extend({
    onAdd: function (_map) {
      var div = L.DomUtil.create(
        "div",
        "leaflet-control-layers filter-control",
      );
      div.innerHTML += `<p><strong>Filtros</strong></p>`;
      for (var filtro in filtros) {
        var checkbox = `<label style="margin:4px;" for="${filtros[filtro]}"><input type="checkbox" id="${filtros[filtro]}">${filtro}</label>`;
        div.innerHTML += checkbox;
      }
      return div;
    },
  });

  new filterLayer().addTo(map);

  document.addEventListener("change", function (event) {
    if (event.target.matches('input[type="checkbox"]')) {
      changeFilter(event.target);
    }
  });
}

/**
 * process and add to layer the markers
 */
function processMarkers(map, results) {
  if (groupLayers) {
    groupLayers.clearLayers();
  } else {
    groupLayers = L.layerGroup().addTo(map);
  }
  const layerGroupProviders = [];
  results.forEach((pinData) => {
    const marker = getMarker(pinData, map);
    marker.addTo(groupLayers);
    layerGroupProviders.push(marker);
  });
}

function addAbout(map) {
  var filterLayer = L.Control.extend({
    onAdd: function (_map) {
      var div = L.DomUtil.create("div", "leaflet-control-layers about-button");
      div.innerHTML += `<a href="#" id="aboutButton"><strong>Sobre hongos.julianmurphy.ar</strong></a>`;
      return div;
    },
  });

  new filterLayer().addTo(map);

  document.getElementById("aboutButton").addEventListener("click", () => {
    MicroModal.show("about");
  });
}

/**
 * execute once, prepare data
 */
async function processData(map, results) {
  fetchedData = results.map((item) => {
    return {
      ...item,
      shipping_all_country: item.shipping_all_country === "TRUE",
      whatsapp: item.whatsapp === "TRUE",
      has_physical_shop: item.has_physical_shop === "TRUE",
    };
  });
  currentData = fetchedData;
  processMarkers(map, fetchedData);
  addFilters(map, fetchedData);
  addAbout(map);
}

function goToProcess(map) {
  if (!PUBLIC_URL_GSHEET_DOC) {
    throw new Error("");
  }
  Papa.parse(`${PUBLIC_URL_GSHEET_DOC}/gviz/tq?tqx=out:csv&sheet=`, {
    download: true,
    header: true,
    complete: (results) => processData(map, results.data),
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let map = L.map("map").setView([-38.34164802597366, -67.4322120098719], 4);
  map.attributionControl.setPrefix(false);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    fullscreenControl: true,
    attribution:
      'Gracias Leaflet y <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>! - <a href="https://github.com/fkmurphy/mushroom_providers" target="_blank">Creado por Julian Murphy</a>',
  }).addTo(map);
  goToProcess(map);
});
