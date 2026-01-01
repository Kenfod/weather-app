document.addEventListener('DOMContentLoaded', () => {
  const apiKey = 'ce9ee7b5f690fb62bdc571a939d1ca6f';

  const cityInput = document.getElementById('cityInput');
  const unitSelect = document.getElementById('unitSelect');
  const searchBtn = document.getElementById('searchBtn');
  const toggleView = document.getElementById('toggleView');
  const weatherDiv = document.getElementById('weather');
  const statusEl = document.getElementById('status');
  const chartCanvas = document.getElementById('weatherChart');

  let chart = null;
  let isChartView = false; 
  let lastFetchKey = null;
  let lastWeatherData = null;

  /* =========================
      1. PREFERENCES & ERROR HANDLING
  ========================== */
  cityInput.value = localStorage.getItem('city') || 'Dubai';
  unitSelect.value = localStorage.getItem('units') || 'metric';

  function savePreferences() {
    localStorage.setItem('city', cityInput.value.trim());
    localStorage.setItem('units', unitSelect.value);
  }

  function handleError(message) {
    weatherDiv.innerHTML = `<div class="weather-item">⚠️ ${message}</div>`;
    statusEl.textContent = '';
  }

  /* =========================
      2. RENDERING FUNCTIONS
  ========================== */
  
  // This builds the small weather cards
  function renderWeatherList(data, units) {
    weatherDiv.innerHTML = '';
    const unitLabel = units === 'metric' ? '°C' : '°F';

    data.list.slice(0, 5).forEach(item => {
      const div = document.createElement('div');
      div.className = 'weather-item';
      div.innerHTML = `
        <strong>${item.dt_txt}</strong>
        <p>🌡 ${Math.round(item.main.temp)}${unitLabel}</p>
        <p style="font-size: 0.8rem;">${item.weather[0].description}</p>
      `;
      weatherDiv.appendChild(div);
    });
  }

  // This draws the chart on the canvas
  function renderChart(data, units) {
    const labels = data.list.slice(0, 8).map(i => i.dt_txt.split(' ')[1].substring(0, 5));
    const temps = data.list.slice(0, 8).map(i => i.main.temp);

    // If a chart already exists, we must destroy it before drawing a new one
    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Temp (${units === 'metric' ? '°C' : '°F'})`,
          data: temps,
          borderColor: '#00feba',
          backgroundColor: 'rgba(0, 254, 186, 0.1)',
          fill: true,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  /* =========================
      3. CORE LOGIC (FETCH & TOGGLE)
  ========================== */

  function fetchWeather() {
    const city = cityInput.value.trim() || 'Dubai';
    const units = unitSelect.value;
    const fetchKey = `${city}_${units}`;

    if (fetchKey === lastFetchKey && lastWeatherData) return;

    lastFetchKey = fetchKey;
    statusEl.textContent = 'Loading weather data…';

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${apiKey}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('City not found');
        return res.json();
      })
      .then(data => {
        statusEl.textContent = '';
        lastWeatherData = data;

        // Render BOTH immediately. CSS hides the chart if needed.
        renderWeatherList(data, units);
        renderChart(data, units);

        // Keep chart visibility in sync with the button state
        chartCanvas.classList.toggle('hidden', !isChartView);
      })
      .catch(error => handleError(error.message));
  }

  function toggleDisplay() {
    isChartView = !isChartView;

    // Show/Hide ONLY the chart
    chartCanvas.classList.toggle('hidden', !isChartView);

    // Update the button text
    toggleView.textContent = isChartView ? 'Hide Chart' : 'Show Chart';

    // Chart.js needs a resize call when it becomes visible
    if (isChartView && chart) {
      setTimeout(() => chart.resize(), 50);
    }
  }

  /* =========================
      4. START THE APP
  ========================== */
  searchBtn.addEventListener('click', () => {
    savePreferences();
    fetchWeather();
  });

  toggleView.addEventListener('click', toggleDisplay);

  // Initial fetch on page load
  fetchWeather();
});