const API_KEY = 'ac38497e24c709ae038661ba2e53d85b'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const AIR_QUALITY_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

// DOM Elements
const elements = {
  cityInput: document.getElementById('cityInput'),
  searchBtn: document.getElementById('searchBtn'),
  geoLocationBtn: document.getElementById('geoLocationBtn'),
  weatherCard: document.getElementById('weatherCard'),
  forecastSection: document.getElementById('forecastSection'),
  forecastGrid: document.getElementById('forecastGrid'),
  errorMsg: document.getElementById('error'),
  messageBox: document.getElementById('messageBox'),
  closeMessage: document.getElementById('closeMessage'),
  cityName: document.getElementById('cityName'),
  temperature: document.getElementById('temperature'),
  feelsLike: document.getElementById('feelsLike'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('windSpeed'),
  windDirection: document.getElementById('windDirection'),
  description: document.getElementById('description'),
  pressure: document.getElementById('pressure'),
  visibility: document.getElementById('visibility'),
  sunrise: document.getElementById('sunrise'),
  sunset: document.getElementById('sunset'),
  weatherIcon: document.getElementById('weatherIcon'),
  currentTime: document.getElementById('currentTime'),
  searchHistory: document.getElementById('searchHistory'),
  clearHistory: document.getElementById('clearHistory'),
  unitRadios: document.querySelectorAll('input[name="unit"]'),
  darkModeToggle: document.getElementById('darkModeToggle'),
  languageSelect: document.getElementById('languageSelect'),
  lastUpdateTime: document.getElementById('lastUpdateTime'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  includeAirQuality: document.getElementById('includeAirQuality'),
  includeAlerts: document.getElementById('includeAlerts'),
  airQualitySection: document.getElementById('airQualitySection'),
  weatherAlertsSection: document.getElementById('weatherAlertsSection'),
  aqi: document.getElementById('aqi'),
  aqiCategory: document.getElementById('aqiCategory'),
  alertsList: document.getElementById('alertsList'),
  savedLocations: document.getElementById('savedLocations'),
  addCurrentToSaved: document.getElementById('addCurrentToSaved')
};

// State Variables
let currentUnit = 'metric';
let currentLang = 'en';
let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
let currentWeatherData = null;
let currentForecastData = null;
let hourlyOffset = 0;
let tempChart = null;
let humidityChart = null;
let pressureChart = null;
let windChart = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  initializeTheme();
  initializeLanguage();
  renderHistory();
  renderSavedLocations();
  addEventListeners();
  
  // Load last searched city if available
  if (history.length > 0) {
    fetchWeather(history[0]);
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme !== null) {
    elements.darkModeToggle.checked = savedTheme === 'true';
  } else {
    elements.darkModeToggle.checked = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  if (elements.darkModeToggle.checked) {
    document.body.classList.add('dark-mode');
  }
}

function initializeLanguage() {
  const savedLang = localStorage.getItem('language') || 'en';
  currentLang = savedLang;
  elements.languageSelect.value = currentLang;
}

function addEventListeners() {
  // Search functionality
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Geolocation
  elements.geoLocationBtn.addEventListener('click', handleGeolocation);

  // Unit toggle
  elements.unitRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      currentUnit = radio.value;
      if (currentWeatherData) {
        updateWeatherUI(currentWeatherData);
        updateForecastUI(currentForecastData);
      }
    });
  });

  // Theme toggle
  elements.darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', elements.darkModeToggle.checked);
  });

  // Language change
  elements.languageSelect.addEventListener('change', () => {
    currentLang = elements.languageSelect.value;
    localStorage.setItem('language', currentLang);
    if (history.length > 0) {
      fetchWeather(history[0]);
    }
  });

  // History and saved locations
  elements.clearHistory.addEventListener('click', clearSearchHistory);
  elements.addCurrentToSaved.addEventListener('click', saveCurrentLocation);

  // Close message
  elements.closeMessage.addEventListener('click', () => {
    elements.messageBox.style.display = 'none';
  });

  // Forecast tabs
  document.querySelectorAll('.forecast-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => switchForecastTab(tab.dataset.tab));
  });

  // Hourly forecast controls
  document.getElementById('prevHourly')?.addEventListener('click', () => {
    hourlyOffset = Math.max(0, hourlyOffset - 1);
    updateHourlyForecastUI(currentForecastData);
  });

  document.getElementById('nextHourly')?.addEventListener('click', () => {
    hourlyOffset = Math.min(5, hourlyOffset + 1);
    updateHourlyForecastUI(currentForecastData);
  });

  // Modal functionality
  document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('infoModal').style.display = 'none';
  });

  // Footer links
  document.getElementById('aboutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showModal('About Weather Dashboard', 'This is an advanced weather dashboard providing real-time weather data, forecasts, and trends.');
  });
}

function handleSearch() {
  const city = elements.cityInput.value.trim();
  if (city) {
    fetchWeather(city);
    elements.cityInput.value = '';
  } else {
    showError('Please enter a city name.');
  }
}

function handleGeolocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by this browser.');
    return;
  }

  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    () => {
      showLoading(false);
      showError('Geolocation access denied. Please enable location services.');
    }
  );
}

async function fetchWeather(city) {
  try {
    showLoading(true);
    
    const weatherResponse = await fetch(
      `${BASE_URL}weather?q=${encodeURIComponent(city)}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
    );

    if (!weatherResponse.ok) {
      throw new Error('City not found or API error.');
    }

    const weatherData = await weatherResponse.json();
    currentWeatherData = weatherData;

    const forecastResponse = await fetch(
      `${BASE_URL}forecast?q=${encodeURIComponent(city)}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
    );

    if (!forecastResponse.ok) {
      throw new Error('Forecast data unavailable.');
    }

    const forecastData = await forecastResponse.json();
    currentForecastData = forecastData;

    updateWeatherUI(weatherData);
    updateForecastUI(forecastData);
    updateHistory(city);

    // Fetch additional data if requested
    if (elements.includeAirQuality.checked) {
      await fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon);
    }

    showLoading(false);
    hideError();
  } catch (err) {
    showLoading(false);
    showError(err.message);
    elements.weatherCard.style.display = 'none';
    elements.forecastSection.style.display = 'none';
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const weatherResponse = await fetch(
      `${BASE_URL}weather?lat=${lat}&lon=${lon}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
    );

    if (!weatherResponse.ok) {
      throw new Error('Location data unavailable.');
    }

    const weatherData = await weatherResponse.json();
    currentWeatherData = weatherData;

    const forecastResponse = await fetch(
      `${BASE_URL}forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
    );

    if (!forecastResponse.ok) {
      throw new Error('Forecast data unavailable.');
    }

    const forecastData = await forecastResponse.json();
    currentForecastData = forecastData;

    updateWeatherUI(weatherData);
    updateForecastUI(forecastData);
    updateHistory(weatherData.name);

    if (elements.includeAirQuality.checked) {
      await fetchAirQuality(lat, lon);
    }

    showLoading(false);
    hideError();
  } catch (err) {
    showLoading(false);
    showError(err.message);
    elements.weatherCard.style.display = 'none';
    elements.forecastSection.style.display = 'none';
  }
}

async function fetchAirQuality(lat, lon) {
  try {
    const response = await fetch(
      `${AIR_QUALITY_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (response.ok) {
      const data = await response.json();
      updateAirQualityUI(data);
    }
  } catch (err) {
    console.warn('Air quality data unavailable:', err.message);
  }
}

function updateWeatherUI(data) {
  const unitSymbol = currentUnit === 'metric' ? 'C' : 'F';
  const speedUnit = currentUnit === 'metric' ? 'm/s' : 'mph';

  elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
  elements.temperature.textContent = `${Math.round(data.main.temp)}°${unitSymbol}`;
  elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°${unitSymbol}`;
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.windSpeed.textContent = `${data.wind.speed} ${speedUnit}`;
  elements.windDirection.textContent = `${data.wind.deg}°`;
  elements.description.textContent = capitalizeFirst(data.weather[0].description);
  elements.pressure.textContent = `${data.main.pressure} hPa`;
  elements.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  elements.sunrise.textContent = formatTime(data.sys.sunrise);
  elements.sunset.textContent = formatTime(data.sys.sunset);
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  elements.currentTime.textContent = new Date().toLocaleTimeString(currentLang, { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  elements.lastUpdateTime.textContent = new Date().toLocaleString(currentLang);

  elements.weatherCard.style.display = 'block';
}

function updateForecastUI(data) {
  elements.forecastGrid.innerHTML = '';
  
  // Get daily forecasts (one per day at 12:00)
  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
  
  dailyData.forEach(day => {
    const date = new Date(day.dt * 1000);
    const card = createForecastCard(day, date, true);
    elements.forecastGrid.appendChild(card);
  });

  elements.forecastSection.style.display = 'block';
  
  // Update charts if trends tab is active
  if (document.getElementById('trendsAnalysis').style.display !== 'none') {
    updateChartsUI(data);
  }
}

function updateHourlyForecastUI(data) {
  const slider = document.getElementById('hourlyForecastSlider');
  if (!slider) return;

  slider.innerHTML = '';
  
  // Show 8 hours starting from offset
  const hourlyData = data.list.slice(hourlyOffset, hourlyOffset + 8);
  
  hourlyData.forEach(hour => {
    const date = new Date(hour.dt * 1000);
    const card = createForecastCard(hour, date, false);
    card.style.display = 'inline-block';
    card.style.margin = '5px';
    card.style.width = '160px';
    slider.appendChild(card);
  });
}

function createForecastCard(data, date, isDaily) {
  const unitSymbol = currentUnit === 'metric' ? 'C' : 'F';
  const card = document.createElement('div');
  card.className = 'forecast-card';
  
  const timeFormat = isDaily 
    ? { weekday: 'short', day: 'numeric' }
    : { hour: '2-digit', minute: '2-digit', hour12: false };

  card.innerHTML = `
    <h4>${date.toLocaleDateString(currentLang, timeFormat)}</h4>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
    <p class="temp">${Math.round(data.main.temp)}°${unitSymbol}</p>
    <p class="desc">${capitalizeFirst(data.weather[0].description)}</p>
    ${isDaily ? `<p class="minmax">${Math.round(data.main.temp_min)}° / ${Math.round(data.main.temp_max)}°</p>` : ''}
  `;
  
  
  return card;
}

function updateAirQualityUI(data) {
  const aqi = data.list[0].main.aqi;
  const categories = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  
  elements.aqi.textContent = aqi;
  elements.aqiCategory.textContent = categories[aqi - 1] || 'Unknown';
  elements.airQualitySection.style.display = 'block';
}

function updateChartsUI(data) {
  const ctx1 = document.getElementById('tempChart');
  const ctx2 = document.getElementById('humidityChart');
  const ctx3 = document.getElementById('pressureChart');
  const ctx4 = document.getElementById('windChart');
  
  if (!ctx1 || !ctx2 || !ctx3 || !ctx4) return;

  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
  const labels = dailyData.map(item => new Date(item.dt * 1000).toLocaleDateString(currentLang, { weekday: 'short' }));
  const temps = dailyData.map(item => Math.round(item.main.temp));
  const humidity = dailyData.map(item => item.main.humidity);
  const pressure = dailyData.map(item => item.main.pressure);
  const windSpeeds = dailyData.map(item => Math.round(item.wind.speed));

  // Destroy existing charts
  if (tempChart) tempChart.destroy();
  if (humidityChart) humidityChart.destroy();
  if (pressureChart) pressureChart.destroy();
  if (windChart) windChart.destroy();

  // Create temperature chart
  tempChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Temperature (°${currentUnit === 'metric' ? 'C' : 'F'})`,
        data: temps,
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } }
    }
  });

  // Create humidity chart
  humidityChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Humidity (%)',
        data: humidity,
        backgroundColor: '#34D399',
        borderColor: '#10B981',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  // Create pressure chart
  pressureChart = new Chart(ctx3, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pressure (hPa)',
        data: pressure,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } }
    }
  });

  // Create wind chart
  windChart = new Chart(ctx4, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `Wind Speed (${currentUnit === 'metric' ? 'm/s' : 'mph'})`,
        data: windSpeeds,
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Update statistical analysis
  updateStatisticalAnalysis(data);
  updatePatternAnalysis(data);
  updateRecommendations(data);
}

function updateStatisticalAnalysis(data) {
  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
  const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
  const speedUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
  
  // Temperature analysis
  const temps = dailyData.map(item => item.main.temp);
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const minTemp = Math.round(Math.min(...temps));
  const maxTemp = Math.round(Math.max(...temps));
  const tempTrend = calculateTrend(temps);
  
  document.getElementById('avgTemp').textContent = `${avgTemp}${unitSymbol}`;
  document.getElementById('tempRange').textContent = `${minTemp}${unitSymbol} to ${maxTemp}${unitSymbol}`;
  document.getElementById('tempTrend').textContent = tempTrend;
  
  // Humidity analysis
  const humidities = dailyData.map(item => item.main.humidity);
  const avgHumidity = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length);
  const minHumidity = Math.min(...humidities);
  const maxHumidity = Math.max(...humidities);
  const humidityTrend = calculateTrend(humidities);
  
  document.getElementById('avgHumidity').textContent = `${avgHumidity}%`;
  document.getElementById('humidityRange').textContent = `${minHumidity}% to ${maxHumidity}%`;
  document.getElementById('humidityTrend').textContent = humidityTrend;
  
  // Pressure analysis
  const pressures = dailyData.map(item => item.main.pressure);
  const avgPressure = Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length);
  const minPressure = Math.min(...pressures);
  const maxPressure = Math.max(...pressures);
  const pressureTrend = calculateTrend(pressures);
  
  document.getElementById('avgPressure').textContent = `${avgPressure} hPa`;
  document.getElementById('pressureRange').textContent = `${minPressure} to ${maxPressure} hPa`;
  document.getElementById('pressureTrend').textContent = pressureTrend;
  
  // Wind analysis
  const windSpeeds = dailyData.map(item => item.wind.speed);
  const avgWind = Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length);
  const maxWind = Math.round(Math.max(...windSpeeds));
  
  // Calculate dominant wind direction
  const windDirections = dailyData.map(item => item.wind.deg);
  const dominantDirection = getWindDirection(windDirections.reduce((a, b) => a + b, 0) / windDirections.length);
  
  document.getElementById('avgWind').textContent = `${avgWind} ${speedUnit}`;
  document.getElementById('maxWind').textContent = `${maxWind} ${speedUnit}`;
  document.getElementById('windDirection').textContent = dominantDirection;
}

function updatePatternAnalysis(data) {
  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
  
  // Temperature stability analysis
  const temps = dailyData.map(item => item.main.temp);
  const tempVariance = calculateVariance(temps);
  let tempStability;
  if (tempVariance < 5) tempStability = "Very stable temperatures expected";
  else if (tempVariance < 10) tempStability = "Moderate temperature variations";
  else tempStability = "Significant temperature fluctuations expected";
  
  document.getElementById('tempStability').textContent = tempStability;
  
  // Humidity patterns
  const humidities = dailyData.map(item => item.main.humidity);
  const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
  let humidityPattern;
  if (avgHumidity > 80) humidityPattern = "High humidity levels - muggy conditions";
  else if (avgHumidity > 60) humidityPattern = "Comfortable humidity levels";
  else if (avgHumidity > 40) humidityPattern = "Moderate humidity - pleasant conditions";
  else humidityPattern = "Low humidity - dry conditions";
  
  document.getElementById('humidityPattern').textContent = humidityPattern;
  
  // Pressure trends
  const pressures = dailyData.map(item => item.main.pressure);
  const pressureTrend = calculateTrend(pressures);
  let pressurePattern;
  if (pressureTrend.includes('Rising')) pressurePattern = "Improving weather conditions expected";
  else if (pressureTrend.includes('Falling')) pressurePattern = "Weather may deteriorate";
  else pressurePattern = "Stable weather conditions";
  
  document.getElementById('pressurePattern').textContent = pressurePattern;
  
  // Precipitation analysis
  const hasRain = dailyData.some(item => item.weather[0].main.toLowerCase().includes('rain'));
  const hasClouds = dailyData.some(item => item.weather[0].main.toLowerCase().includes('cloud'));
  let precipitationInsight;
  if (hasRain) precipitationInsight = "Rain expected - carry an umbrella";
  else if (hasClouds) precipitationInsight = "Cloudy skies - possible light showers";
  else precipitationInsight = "Clear skies - low precipitation chance";
  
  document.getElementById('precipitationInsight').textContent = precipitationInsight;
}

function updateRecommendations(data) {
  const currentWeather = currentWeatherData;
  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
  
  // Clothing recommendations
  const avgTemp = dailyData.reduce((sum, item) => sum + item.main.temp, 0) / dailyData.length;
  let clothingAdvice;
  if (currentUnit === 'metric') {
    if (avgTemp > 25) clothingAdvice = "Light, breathable clothing recommended";
    else if (avgTemp > 15) clothingAdvice = "Comfortable clothing with light layers";
    else if (avgTemp > 5) clothingAdvice = "Warm clothing and jacket needed";
    else clothingAdvice = "Heavy winter clothing essential";
  } else {
    if (avgTemp > 77) clothingAdvice = "Light, breathable clothing recommended";
    else if (avgTemp > 59) clothingAdvice = "Comfortable clothing with light layers";
    else if (avgTemp > 41) clothingAdvice = "Warm clothing and jacket needed";
    else clothingAdvice = "Heavy winter clothing essential";
  }
  
  document.getElementById('clothingAdvice').textContent = clothingAdvice;
  
  // Activity recommendations
  const avgWind = dailyData.reduce((sum, item) => sum + item.wind.speed, 0) / dailyData.length;
  const hasStorm = dailyData.some(item => item.weather[0].main.toLowerCase().includes('storm'));
  let activityAdvice;
  if (hasStorm) activityAdvice = "Indoor activities recommended";
  else if (avgWind > 10) activityAdvice = "Be cautious with outdoor activities";
  else if (avgTemp > 20 && avgTemp < 30) activityAdvice = "Perfect weather for outdoor activities";
  else activityAdvice = "Check conditions before outdoor plans";
  
  document.getElementById('activityAdvice').textContent = activityAdvice;
  
  // Health recommendations
  const avgHumidity = dailyData.reduce((sum, item) => sum + item.main.humidity, 0) / dailyData.length;
  let healthAdvice;
  if (avgHumidity > 80) healthAdvice = "Stay hydrated - high humidity levels";
  else if (avgHumidity < 40) healthAdvice = "Use moisturizer - dry conditions";
  else if (avgTemp > 30) healthAdvice = "Avoid prolonged sun exposure";
  else healthAdvice = "Great conditions for outdoor exercise";
  
  document.getElementById('healthAdvice').textContent = healthAdvice;
}

function calculateTrend(values) {
  if (values.length < 2) return "Insufficient data";
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  const percentChange = Math.abs((difference / firstAvg) * 100);
  
  if (Math.abs(difference) < 1) return "Stable";
  else if (difference > 0) return `Rising (+${percentChange.toFixed(1)}%)`;
  else return `Falling (-${percentChange.toFixed(1)}%)`;
}

function calculateVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function switchForecastTab(tabName) {
  // Update active tab
  document.querySelectorAll('.forecast-tabs .tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Show corresponding content
  document.getElementById('dailyForecast').style.display = tabName === 'daily' ? 'block' : 'none';
  document.getElementById('hourlyForecast').style.display = tabName === 'hourly' ? 'block' : 'none';
  document.getElementById('trendsAnalysis').style.display = tabName === 'trends' ? 'block' : 'none';

  // Update content based on tab
  if (tabName === 'hourly' && currentForecastData) {
    updateHourlyForecastUI(currentForecastData);
  } else if (tabName === 'trends' && currentForecastData) {
    updateChartsUI(currentForecastData);
  }
}

function updateHistory(city) {
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > 5) history.pop();
    localStorage.setItem('weatherHistory', JSON.stringify(history));
    renderHistory();
  }
}

function renderHistory() {
  elements.searchHistory.innerHTML = '';
  if (history.length === 0) {
    elements.searchHistory.innerHTML = '<li class="empty">No recent searches</li>';
    return;
  }
  
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => fetchWeather(city));
    elements.searchHistory.appendChild(li);
  });
}

function saveCurrentLocation() {
  if (!currentWeatherData) {
    showError('No current location to save.');
    return;
  }

  const location = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`;
  if (!savedLocations.includes(location)) {
    savedLocations.push(location);
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    renderSavedLocations();
  }
}

function renderSavedLocations() {
  elements.savedLocations.innerHTML = '';
  if (savedLocations.length === 0) {
    elements.savedLocations.innerHTML = '<li class="empty">No saved locations</li>';
    return;
  }
  
  savedLocations.forEach((location, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span onclick="fetchWeather('${location.split(',')[0]}')">${location}</span>
      <button onclick="removeSavedLocation(${index})" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    elements.savedLocations.appendChild(li);
  });
}

function removeSavedLocation(index) {
  savedLocations.splice(index, 1);
  localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
  renderSavedLocations();
}

function clearSearchHistory() {
  history = [];
  localStorage.setItem('weatherHistory', JSON.stringify(history));
  renderHistory();
}

function showError(message) {
  elements.errorMsg.textContent = message;
  elements.messageBox.style.display = 'flex';
}

function hideError() {
  elements.messageBox.style.display = 'none';
}

function showLoading(show) {
  elements.loadingSpinner.style.display = show ? 'flex' : 'none';
}

function showModal(title, content) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('infoModal').style.display = 'flex';
}

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString(currentLang, { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Global function for saved locations
window.removeSavedLocation = removeSavedLocation;
