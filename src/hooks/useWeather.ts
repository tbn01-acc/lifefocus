import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

interface CachedLocation {
  lat: number;
  lon: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = 'user_location_cache';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedLocation(): CachedLocation | null {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedLocation;
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < LOCATION_CACHE_DURATION) {
        return parsed;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedLocation(lat: number, lon: number) {
  try {
    const data: CachedLocation = { lat, lon, timestamp: Date.now() };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache errors
  }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`
        );
        const data = await response.json();
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch weather');
        setLoading(false);
      }
    };

    // Check for cached location first
    const cachedLocation = getCachedLocation();
    if (cachedLocation) {
      fetchWeather(cachedLocation.lat, cachedLocation.lon);
      return;
    }

    // Try to get user's location (only if not cached)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Cache the location
          setCachedLocation(latitude, longitude);
          fetchWeather(latitude, longitude);
        },
        () => {
          // Default to Moscow if location denied
          fetchWeather(55.7558, 37.6173);
        }
      );
    } else {
      fetchWeather(55.7558, 37.6173);
    }
  }, []);

  return { weather, loading, error };
}

// WMO Weather interpretation codes
export function getWeatherIcon(code: number, isDay: boolean): string {
  // Clear sky
  if (code === 0) return isDay ? '☀️' : '🌙';
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) return isDay ? '🌤️' : '☁️';
  // Overcast
  if (code === 3) return '☁️';
  // Fog
  if (code >= 45 && code <= 48) return '🌫️';
  // Drizzle
  if (code >= 51 && code <= 57) return '🌧️';
  // Rain
  if (code >= 61 && code <= 67) return '🌧️';
  // Snow
  if (code >= 71 && code <= 77) return '🌨️';
  // Rain showers
  if (code >= 80 && code <= 82) return '🌦️';
  // Snow showers
  if (code >= 85 && code <= 86) return '🌨️';
  // Thunderstorm
  if (code >= 95 && code <= 99) return '⛈️';
  
  return isDay ? '☀️' : '🌙';
}
