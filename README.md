# Weather Dashboard

A modern, responsive weather dashboard web app that provides real-time weather insights, 5-day and hourly forecasts, air quality, and weather alerts using the [OpenWeatherMap API](https://openweathermap.org/).

**Live Demo:**  
[https://weather-dashboard-gamma-gules.vercel.app/](https://weather-dashboard-gamma-gules.vercel.app/)

## Features

- **Current Weather:** View temperature, humidity, wind, pressure, visibility, sunrise/sunset, and weather icon for any city.
- **5-Day & 24-Hour Forecast:** Switch between daily and hourly forecasts.
- **Air Quality & Alerts:** Optionally display air quality index and weather alerts (if available).
- **Geolocation:** Fetch weather for your current location.
- **Unit & Language Toggle:** Switch between Celsius/Fahrenheit and multiple languages.
- **Dark Mode:** Toggle dark/light theme.
- **Search History:** Quickly revisit recent searches.
- **Responsive Design:** Works well on desktop and mobile.
- **Weather Trends & Map:** (UI present, implementation pending)

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/weather_dashboard.git
   cd weather_dashboard
   ```

2. **Open `index.html` in your browser.**

3. **API Key:**  
   The app uses a demo OpenWeatherMap API key. For production, [get your own API key](https://openweathermap.org/appid) and replace the `API_KEY` in [script.js](script.js).

## File Structure

- `index.html` – Main HTML structure and UI.
- `styles.css` – Responsive, dark-mode-friendly styles.
- `script.js` – All interactive logic, API calls, and UI updates.
- `README.md` – Project documentation.

## Usage

- Enter a city name or ZIP code and click **Search**.
- Use **Use My Location** to get weather for your current location.
- Toggle units, language, and dark mode from the header.
- Click on recent searches to reload weather data.
- Optionally, enable air quality and weather alerts (if available for the location).

## Dependencies

- [OpenWeatherMap API](https://openweathermap.org/)
- [Font Awesome](https://fontawesome.com/) (for icons)
- [Chart.js](https://www.chartjs.org/) (for trends, UI present)

## License

MIT

---

**Note:**  
Some advanced features (weather map, trends, saved locations) have UI placeholders but may require further implementation.