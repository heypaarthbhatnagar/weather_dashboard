  // API Configuration
  const API_KEY = 'ac38497e24c709ae038661ba2e53d85b';
  const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

  // DOM Elements
  const cityInput = document.getElementById('cityInput');
  const searchBtn = document.getElementById('searchBtn');
  const geoLocationBtn = document.getElementById('geoLocationBtn');
  const weatherCard = document.getElementById('weatherCard');
  const forecastSection = document.getElementById('forecastSection');
  const forecastGrid = document.getElementById('forecastGrid');
  const errorMsg = document.getElementById('error');
  const messageBox = document.getElementById('messageBox');
  const closeMessage = document.getElementById('closeMessage');
  const cityName = document.getElementById('cityName');
  const temperature = document.getElementById('temperature');
  const feelsLike = document.getElementById('feelsLike');
  const humidity = document.getElementById('humidity');
  const windSpeed = document.getElementById('windSpeed');
  const windDirection = document.getElementById('windDirection');
  const description = document.getElementById('description');
  const pressure = document.getElementById('pressure');
  const visibility = document.getElementById('visibility');
  const sunrise = document.getElementById('sunrise');
  const sunset = document.getElementById('sunset');
  const weatherIcon = document.getElementById('weatherIcon');
  const currentTime = document.getElementById('currentTime');
  const searchHistory = document.getElementById('searchHistory');
  const clearHistory = document.getElementById('clearHistory');
  const unitRadios = document.querySelectorAll('input[name="unit"]');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const languageSelect = document.getElementById('languageSelect');
  const lastUpdateTime = document.getElementById('lastUpdateTime');

  // State Variables
  let currentUnit = 'metric'; // Default to Celsius
  let currentLang = 'en'; // Default to English
  let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];

  // Initialize on Load
  document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeLanguage();
    renderHistory();
    addEventListeners();
    // Load last searched city if available
    if (history.length > 0) {
      fetchWeather(history[0]);
    }
  });

  // Initialize Theme (Dark Mode)
  function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkModeToggle.checked = prefersDark;
    if (prefersDark) {
      document.body.classList.add('dark-mode');
    }
  }

  // Initialize Language
  function initializeLanguage() {
    // Default language is already 'en' in HTML
    languageSelect.value = currentLang;
  }

  // Add Event Listeners
  function addEventListeners() {
    // Search Button
    searchBtn.addEventListener('click', () => {
      const city = cityInput.value.trim();
      if (city) {
        fetchWeather(city);
        cityInput.value = '';
      } else {
        showError('Please enter a city name.');
      }
    });

    // Geolocation Button
    geoLocationBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
          },
          () => {
            showError('Geolocation access denied. Please enable location services.');
          }
        );
      } else {
        showError('Geolocation is not supported by this browser.');
      }
    });

    // Unit Toggle
    unitRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        currentUnit = radio.value;
        if (history.length > 0) {
          fetchWeather(history[0]); // Refresh with new unit
        }
      });
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode');
    });

    // Language Select
    languageSelect.addEventListener('change', () => {
      currentLang = languageSelect.value;
      // For simplicity, language affects API calls (OpenWeatherMap supports it)
      if (history.length > 0) {
        fetchWeather(history[0]); // Refresh with new language
      }
    });

    // Clear History
    clearHistory.addEventListener('click', () => {
      history = [];
      localStorage.setItem('weatherHistory', JSON.stringify(history));
      renderHistory();
    });

    // Close Message Box
    closeMessage.addEventListener('click', () => {
      messageBox.style.display = 'none';
    });
  }

  // Fetch Weather Data by City Name
  async function fetchWeather(city) {
    try {
      const weatherResponse = await fetch(
        `${BASE_URL}weather?q=${encodeURIComponent(city)}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
      );
      if (!weatherResponse.ok) {
        throw new Error('City not found or API error.');
      }
      const weatherData = await weatherResponse.json();

      const forecastResponse = await fetch(
        `${BASE_URL}forecast?q=${encodeURIComponent(city)}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
      );
      if (!forecastResponse.ok) {
        throw new Error('Forecast data unavailable.');
      }
      const forecastData = await forecastResponse.json();

      updateWeatherUI(weatherData);
      updateForecastUI(forecastData);
      updateHistory(city);
      hideError();
    } catch (err) {
      showError(err.message);
      weatherCard.style.display = 'none';
      forecastSection.style.display = 'none';
    }
  }

  // Fetch Weather Data by Coordinates
  async function fetchWeatherByCoords(lat, lon) {
    try {
      const weatherResponse = await fetch(
        `${BASE_URL}weather?lat=${lat}&lon=${lon}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
      );
      if (!weatherResponse.ok) {
        throw new Error('Location data unavailable.');
      }
      const weatherData = await weatherResponse.json();

      const forecastResponse = await fetch(
        `${BASE_URL}forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`
      );
      if (!forecastResponse.ok) {
        throw new Error('Forecast data unavailable.');
      }
      const forecastData = await forecastResponse.json();

      updateWeatherUI(weatherData);
      updateForecastUI(forecastData);
      updateHistory(weatherData.name);
      hideError();
    } catch (err) {
      showError(err.message);
      weatherCard.style.display = 'none';
      forecastSection.style.display = 'none';
    }
  }

  // Update Current Weather UI
  function updateWeatherUI(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}`;
    windDirection.textContent = `${data.wind.deg}°`;
    description.textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${data.visibility / 1000} km`;
    sunrise.textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit', hour12: false });
    sunset.textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit', hour12: false });
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    currentTime.textContent = new Date().toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit', hour12: false });
    lastUpdateTime.textContent = new Date().toLocaleString(currentLang);

    weatherCard.style.display = 'block';
  }

  // Update 5-Day Forecast UI
  function updateForecastUI(data) {
    forecastGrid.innerHTML = '';
    // Filter forecast to show one entry per day (e.g., at 12:00)
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    dailyData.forEach(day => {
      const date = new Date(day.dt * 1000);
      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.style.background = 'var(--bg-tertiary)';
      card.style.padding = '15px';
      card.style.borderRadius = '4px';
      card.style.textAlign = 'center';
      card.innerHTML = `
        <h4 style="font-weight: 500; margin-bottom: 10px;">${date.toLocaleDateString(currentLang, { weekday: 'short', day: 'numeric', hour12: false })}</h4>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Weather Icon" style="width: 50px; margin-bottom: 10px;">
        <p style="margin-bottom: 5px;">${Math.round(day.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${day.weather[0].description.charAt(0).toUpperCase() + day.weather[0].description.slice(1)}</p>
      `;
      forecastGrid.appendChild(card);
    });
    forecastSection.style.display = 'block';
  }

  // Update Search History
  function updateHistory(city) {
    if (!history.includes(city)) {
      history.unshift(city);
      if (history.length > 5) history.pop(); // Limit to 5 recent searches
      localStorage.setItem('weatherHistory', JSON.stringify(history));
      renderHistory();
    }
  }

  // Render Search History
  function renderHistory() {
    searchHistory.innerHTML = '';
    if (history.length === 0) {
      searchHistory.innerHTML = '<li style="color: var(--text-secondary);">No recent searches</li>';
      return;
    }
    history.forEach(city => {
      const li = document.createElement('li');
      li.textContent = city;
      li.addEventListener('click', () => fetchWeather(city));
      searchHistory.appendChild(li);
    });
  }

  // Show Error Message
  function showError(message) {
    errorMsg.textContent = message;
    messageBox.style.display = 'flex';
  }

  // Hide Error Message
  function hideError() {
    messageBox.style.display = 'none';
  }

  // Tab Switching for Forecast (Daily/Hourly)
  const forecastTabs = document.querySelectorAll('.forecast-tabs button');
  const dailyForecast = document.getElementById('dailyForecast');
  const hourlyForecast = document.getElementById('hourlyForecast');

  // Store latest forecast data for hourly rendering
  let latestForecastData = null;

  // Render Hourly Forecast
  function updateHourlyForecastUI(data) {
    if (!hourlyForecast) return;
    hourlyForecast.innerHTML = '';
    // Show next 8 intervals (24 hours, 3-hour steps)
    const hourlyData = data.list.slice(0, 8);
    hourlyData.forEach(hour => {
      const date = new Date(hour.dt * 1000);
      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.style.background = 'var(--bg-tertiary)';
      card.style.padding = '10px';
      card.style.borderRadius = '4px';
      card.style.textAlign = 'center';
      card.style.display = 'inline-block';
      card.style.margin = '5px';
      card.style.width = "130px";
      card.innerHTML = `
        <h5 style="font-weight: 500; margin-bottom: 5px;">${date.toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit', hour12: false })}</h5>
        <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png" alt="Weather Icon" style="width: 40px; margin-bottom: 5px;">
        <p style="margin-bottom: 2px;">${Math.round(hour.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">${hour.weather[0].description.charAt(0).toUpperCase() + hour.weather[0].description.slice(1)}</p>
      `;
      hourlyForecast.appendChild(card);
    });
  }

  forecastTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      forecastTabs.forEach(btn => btn.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'daily') {
        dailyForecast.style.display = 'block';
        hourlyForecast.style.display = 'none';
      } else {
        dailyForecast.style.display = 'none';
        hourlyForecast.style.display = 'block';
        if (latestForecastData) {
          updateHourlyForecastUI(latestForecastData);
        }
      }
    });
  });

  // Patch: Store forecast data for hourly use
  const originalUpdateForecastUI = updateForecastUI;
  updateForecastUI = function(data) {
    latestForecastData = data;
    originalUpdateForecastUI(data);
    // If hourly tab is active, update hourly forecast as well
    if (hourlyForecast && hourlyForecast.style.display !== 'none') {
      updateHourlyForecastUI(data);
    }
  };
