// ==================== Variables globales ====================
let todaysRecords = [];
let tomorrowsRecords = [];
let currentDataset = "today";
let currentRecords = [];
let currentPage = 1;
const itemsPerPage = 15;
let totalPages = 1;
let autoPageInterval = null;
let inactivityTimer = null;
let currentLang = "en"; // idioma por defecto

// ==================== Referencias DOM ====================
const homeContainer      = document.getElementById('home-container');
const searchContainer    = document.getElementById('search-container');
const tableContainer     = document.getElementById('table-container');
const searchTransferBtn  = document.getElementById('search-transfer-btn');
const adventureBtn       = document.getElementById('adventure-btn');
const backHomeBtn        = document.getElementById('back-home-btn');
const searchInput        = document.getElementById('search-input');
const searchButton       = document.getElementById('search-button');
const searchResult       = document.getElementById('search-result');
const searchLegend       = document.getElementById('search-legend');
const mainTitle          = document.getElementById('main-title');
const langSelector       = document.getElementById('lang-selector');
const searchTitle        = document.getElementById('search-title');
const searchTransferText = document.getElementById('search-transfer-text');
const adventureText      = document.getElementById('adventure-text');

// ==================== Traducciones ====================
const translations = {
  en: {
    todayTitle: "TODAY’S PICK-UP AIRPORT TRANSFERS",
    tomorrowTitle: "TOMORROW’S PICK-UP AIRPORT TRANSFERS",
    searchLegend: "If you have any questions about your pickup transfer time, please reach out to your Royalton Excursion Rep at the hospitality desk. You can also contact us easily via chat on the NexusTours App or by calling +52 998 251 6559. We're here to assist you!",
    searchTitle: "Find my transfer",
    resultTitle: "We got you, here are your transfer details",
    bookingNo: "Booking No.",
    flightNo: "Flight No.",
    hotel: "Hotel",
    pickup: "Pick-Up time",
    back: "← Back",
    searchPlaceholder: "Enter your booking number",
    searchButton: "Search",
    searchTransferBtn: "Search my booking number",
    adventureBtn: "Find your next adventure",
    errorText: "If you have any questions about your pickup transfer time, please reach out to your Royalton Excursion Rep at the hospitality desk. You can also contact us easily via chat on the NexusTours App or by calling +52 998 251 6559. We're here to assist you!"
  },
  es: {
    todayTitle: "TRASLADOS DE AEROPUERTO DE HOY",
    tomorrowTitle: "TRASLADOS DE AEROPUERTO DE MAÑANA",
    searchLegend: "Si tienes alguna pregunta sobre tu horario de traslado, por favor acude a tu representante de Royalton en el lobby. También puedes contactarnos fácilmente vía chat en la App de NexusTours o llamando al +52 998 251 6559. ¡Estamos aquí para ayudarte!",
    searchTitle: "Buscar mi traslado",
    resultTitle: "Aquí están los detalles de tu traslado",
    bookingNo: "Número de reserva",
    flightNo: "Número de vuelo",
    hotel: "Hotel",
    pickup: "Hora de recogida",
    back: "← Regresar",
    searchPlaceholder: "Ingresa tu número de reserva",
    searchButton: "Buscar",
    searchTransferBtn: "Buscar mi número de reserva",
    adventureBtn: "Encuentra tu próxima aventura",
    errorText: "Si tienes alguna pregunta sobre tu horario de traslado, por favor acude a tu representante de Royalton en el lobby. También puedes contactarnos fácilmente vía chat en la App de NexusTours o llamando al +52 998 251 6559. ¡Estamos aquí para ayudarte!"
  },
  fr: {
    todayTitle: "TRANSFERTS AÉROPORT D’AUJOURD’HUI",
    tomorrowTitle: "TRANSFERTS AÉROPORT DE DEMAIN",
    searchLegend: "Si vous avez des questions concernant votre transfert, veuillez contacter votre représentant Royalton à la réception. Vous pouvez également nous joindre facilement via le chat de l'application NexusTours ou en appelant le +52 998 251 6559. Nous sommes là pour vous aider !",
    searchTitle: "Trouver mon transfert",
    resultTitle: "Voici les détails de votre transfert",
    bookingNo: "N° de réservation",
    flightNo: "N° de vol",
    hotel: "Hôtel",
    pickup: "Heure de prise en charge",
    back: "← Retour",
    searchPlaceholder: "Entrez votre numéro de réservation",
    searchButton: "Rechercher",
    searchTransferBtn: "Rechercher mon numéro de réservation",
    adventureBtn: "Trouvez votre prochaine aventure",
    errorText: "Si vous avez des questions concernant votre transfert, veuillez contacter votre représentant Royalton à la réception. Vous pouvez également nous joindre facilement via le chat de l'application NexusTours ou en appelant le +52 998 251 6559. Nous sommes là pour vous aider !"
  }
};

// ==================== Cargar ambos JSON ====================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [todayResp, tomorrowResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    if (!todayResp.ok)    throw new Error(`Fetch failed for data.json: ${todayResp.status}`);
    if (!tomorrowResp.ok) throw new Error(`Fetch failed for data_2.json: ${tomorrowResp.status}`);

    const todayData    = await todayResp.json();
    const tomorrowData = await tomorrowResp.json();

    todaysRecords    = todayData.templates?.content || [];
    tomorrowsRecords = tomorrowData.templates?.content || [];

    currentDataset = "today";
    currentRecords = todaysRecords;
    totalPages     = Math.max(1, Math.ceil(currentRecords.length / itemsPerPage));

    updateTitle();
    updateStaticTexts();
    renderTable();
  } catch (error) {
    console.error('Error loading data:', error);
    tableContainer.innerHTML = `<p style="color:red;text-align:center;">Error loading data.</p>`;
  }
});

// ==================== Actualizar textos ====================
function updateTitle() {
  mainTitle.childNodes[0].nodeValue = currentDataset === "today"
    ? translations[currentLang].todayTitle + " "
    : translations[currentLang].tomorrowTitle + " ";
}

function updateStaticTexts() {
  searchLegend.innerText = translations[currentLang].searchLegend;
  searchTitle.innerText  = translations[currentLang].searchTitle;
  backHomeBtn.innerText  = translations[currentLang].back;
  searchInput.placeholder = translations[currentLang].searchPlaceholder;
  searchTransferText.innerText = translations[currentLang].searchTransferBtn;
  adventureText.innerText      = translations[currentLang].adventureBtn;
}

// ==================== Renderizar tabla ====================
function renderTable() {
  if (autoPageInterval) {
    clearInterval(autoPageInterval);
    autoPageInterval = null;
  }

  currentRecords = currentDataset === "today" ? todaysRecords : tomorrowsRecords;
  totalPages     = Math.max(1, Math.ceil(currentRecords.length / itemsPerPage));

  const startIndex  = (currentPage - 1) * itemsPerPage;
  const pageRecords = currentRecords.slice(startIndex, startIndex + itemsPerPage);

  let html = `
    <div class="bktable">
      <table>
        <thead>
          <tr>
            <th>${translations[currentLang].bookingNo}</th>
            <th>${translations[currentLang].flightNo}</th>
            <th>${translations[currentLang].hotel}</th>
            <th>${translations[currentLang].pickup}</th>
          </tr>
        </thead>
        <tbody>
  `;

  pageRecords.forEach(item => {
    html += `
      <tr>
        <td>${item.id}</td>
        <td>${item.Flight}</td>
        <td>${item.HotelName}</td>
        <td>${item.PickupTime}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
    <div class="auto-page-info">Page ${currentPage} of ${totalPages}</div>
  `;

  tableContainer.innerHTML = html;
  startAutoPagination();
}

// ==================== Auto-paginación ====================
function startAutoPagination() {
  autoPageInterval = setInterval(() => {
    currentPage++;
    if (currentPage > totalPages) {
      currentDataset = currentDataset === "today" ? "tomorrow" : "today";
      updateTitle();
      currentPage = 1;
    }
    renderTable();
  }, 10000);
}

// ==================== Navegación y búsqueda ====================
searchTransferBtn.addEventListener('click', goToSearch);
adventureBtn.addEventListener('click', () => {
  alert(translations[currentLang].adventureBtn);
});
backHomeBtn.addEventListener('click', () => {
  searchResult.style.opacity = '0';
  goToHome();
});

function goToSearch() {
  homeContainer.style.display   = 'none';
  searchContainer.style.display = 'block';
  searchResult.innerHTML        = '';
  searchInput.value             = '';
  searchLegend.style.display    = 'block';
  clearInterval(autoPageInterval);
  clearTimeout(inactivityTimer);
}

function goToHome() {
  searchContainer.style.display = 'none';
  homeContainer.style.display   = 'block';
  searchResult.innerHTML        = '';
  searchInput.value             = '';
  clearTimeout(inactivityTimer);
  currentPage = 1;
  renderTable();
}

searchButton.addEventListener('click', () => {
  clearTimeout(inactivityTimer);
  searchLegend.style.display = 'none';
  searchResult.style.opacity = '1';

  const query = searchInput.value.trim().toLowerCase();
  if (!query) return goToHome();

  const matchesToday    = todaysRecords.filter(r => r.id.toLowerCase() === query);
  const matchesTomorrow = tomorrowsRecords.filter(r => r.id.toLowerCase() === query);
  const foundRecords    = [...matchesToday, ...matchesTomorrow];

  inactivityTimer = setTimeout(goToHome, 20000);

  if (foundRecords.length > 0) {
    let resultHTML = `
      <div class="bktableqrresultados">
        <p class="titulo_result"><strong>${translations[currentLang].resultTitle}</strong></p>
        <table class="transfer-result-table">
          <thead>
            <tr>
              <th>${translations[currentLang].bookingNo}</th>
              <th>${translations[currentLang].flightNo}</th>
              <th>${translations[currentLang].hotel}</th>
              <th>${translations[currentLang].pickup}</th>
            </tr>
          </thead>
          <tbody>
    `;
    foundRecords.forEach(record => {
      resultHTML += `
        <tr>
          <td>${record.id}</td>
          <td>${record.Flight}</td>
          <td>${record.HotelName}</td>
          <td>${record.PickupTime}</td>
        </tr>
      `;
    });
    resultHTML += `
          </tbody>
        </table>
      </div>
    `;
    searchResult.innerHTML = resultHTML;
  } else {
    searchResult.innerHTML = `
      <div class="bktableqr">
        <p class="error-text">${translations[currentLang].errorText}</p>
        <div class="qr-container">
          <img src="https://raw.githubusercontent.com/gr-hub-projects/Display_Royalton_Punta_Cana/refs/heads/main/Logo_Dysp.png" alt="QR Code">
        </div>
      </div>
    `;
  }
});

// ==================== Selector de idioma ====================
langSelector.addEventListener("change", (e) => {
  currentLang = e.target.value;
  updateTitle();
  updateStaticTexts();
  renderTable();
});
