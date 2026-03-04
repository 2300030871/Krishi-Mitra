import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
};

export default function WeatherCard() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: 'Geolocation is not supported in this browser.', data: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const { data } = await api.get('/weather', {
            params: { lat, lon },
          });

          setState({ loading: false, error: '', data });
        } catch (error) {
          setState({ loading: false, error: error.message || 'Unable to fetch weather data.', data: null });
        }
      },
      () => {
        setState({
          loading: false,
          error: 'Could not fetch weather data. Please enable location services.',
          data: null,
        });
      }
    );
  }, []);

  const condition = useMemo(() => {
    if (!state.data) return '';
    return weatherCodeMap[state.data.weather_code] || 'Unknown';
  }, [state.data]);

  return (
    <div className="card weather-card">
      <h3>Local Weather</h3>
      {state.loading ? <p>Fetching weather...</p> : null}
      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.data ? (
        <div className="weather-grid">
          <div>
            <p className="weather-label">Temperature</p>
            <p className="weather-value">{state.data.temperature_2m}°C</p>
          </div>
          <div>
            <p className="weather-label">Condition</p>
            <p className="weather-value">{condition}</p>
          </div>
          <div>
            <p className="weather-label">Humidity</p>
            <p className="weather-value">{state.data.relative_humidity_2m}%</p>
          </div>
          <div>
            <p className="weather-label">Wind Speed</p>
            <p className="weather-value">{state.data.wind_speed_10m} km/h</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
