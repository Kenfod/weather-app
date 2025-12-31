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
     1. USER PREFERENCES (localStorage)
  ========================== */
  cityInput.value = localStorage.getItem('city') || 'Dubai';
  unitSelect.value = localStorage.getItem('units') || 'metric';

  /* =========================
     2. EVENT LISTENERS
  ========================== */
  searchBtn.addEventListener('click', () => {
    savePreferences();
    fetchWeather();
  });

  toggleView.addEventListener('click', toggleDisplay);

  /* =========================
     3. SAVE USER SETTINGS
  ========================== */
  function savePreferences() {
    localStorage.setItem('city', cityInput.value.trim());
    localStorage.setItem('units', unitSelect.value);
  }

  /* =========================
     4. FETCH WITH OPTIMIZATION + ERROR HANDLING
  ========================== */
  function fetchWeather() {
    const city = cityInput.value.trim() || 'Dubai';
    const units = unitSelect.value;
    const fetchKey = `${city}_${units}`;

    // Avoid redundant API calls
    if (fetchKey === lastFetchKey) {
      console.log('Using cached data – no new fetch');
      return;
    }

    lastFetchKey = fetchKey;
    weatherDiv.innerHTML = '';
    statusEl.textContent = 'Loading weather data…';

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${apiKey}`;

    fetch(url)
      .then(res => {
        if (res.status === 404) throw new Error('City not found');
        if (res.status === 429) throw new Error('Rate limit exceeded');
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        statusEl.textContent = '';
        lastWeatherData = data;

        if (!isChartView) {
          renderWeatherList(data, units);
        }

        if (isChartView) {
          renderChart(data, units)
        }
      })
      .catch(error => handleError(error.message));
      }

  /* =========================
     5. ERROR + FALLBACK STATES
  ========================== */
  function handleError(message) {
    weatherDiv.innerHTML = `
      <div class="weather-item">
        ⚠️ ${message}. Please try again.
      </div>
    `;
     statusEl.textContent = '';
  }

  /* =========================
     6. LIST VIEW
  ========================== */
  function renderWeatherList(data, units) {
    weatherDiv.innerHTML = '';

    data.list.slice(0, 5).forEach(item => {
      const div = document.createElement('div');
      div.className = 'weather-item';
      div.innerHTML = `
        <strong>${item.dt_txt}</strong>
        <p>🌡 ${item.main.temp}° ${units === 'metric' ? 'C' : 'F'}</p>
        <p>${item.weather[0].description}</p>
      `;
      weatherDiv.appendChild(div);
    });
  }

  /* =========================
     7. CHART VIEW
  ========================== */
  function renderChart(data, units) {
    const labels = data.list.slice(0, 8).map(i => i.dt_txt);
    const temps = data.list.slice(0, 8).map(i => i.main.temp);

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Temperature (${units === 'metric' ? '°C' : '°F'})`,
          data: temps,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  /* =========================
     8. TOGGLE LIST ↔ CHART
  ========================== */
  function toggleDisplay() {
    isChartView = !isChartView;

    weatherDiv.classList.toggle('hidden', isChartView);
    chartCanvas.classList.toggle('hidden', !isChartView);

    toggleView.textContent = isChartView
      ? 'Show List'
      : 'Show Chart';

    // ✅ Render or resize chart only when visible
    if (isChartView && lastWeatherData) {
      renderChart(lastWeatherData, unitSelect.value);

      // Force Chart.js resize after display
      setTimeout(() => chart?.resize(), 50);
    }
  }

  /* =========================
     9. A/B UI VARIATION (ENGAGEMENT TEST)
  ========================== */
  if (Math.random() > 0.5) {
    document.querySelector('h1').textContent += ' (Enhanced)';
    console.log('UI Variant B');
  }

  /* =========================
     10. INITIAL LOAD
  ========================== */
  fetchWeather();
});
