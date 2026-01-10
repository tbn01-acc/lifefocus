import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  precipitation: number;
}

const WEATHER_NOTIFICATION_KEY = 'weather_notification_settings';
const LAST_NOTIFICATION_KEY = 'last_weather_notification';

export function useWeatherNotifications() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const settings = localStorage.getItem(WEATHER_NOTIFICATION_KEY);
    if (settings) {
      const parsed = JSON.parse(settings);
      setIsEnabled(parsed.enabled || false);
      setNotificationTime(parsed.time || '08:00');
    }
    
    // Check notification permission
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setPermissionGranted(granted);
      return granted;
    }

    return false;
  }, []);

  // Get weather recommendations based on conditions
  const getWeatherRecommendations = useCallback((weather: WeatherData, isRussian: boolean): string[] => {
    const recs: string[] = [];

    // Temperature recommendations
    if (weather.temperature < -10) {
      recs.push(isRussian ? 'Очень холодно! Оденьтесь тепло' : 'Very cold! Dress warmly');
    } else if (weather.temperature < 0) {
      recs.push(isRussian ? 'Мороз. Не забудьте шапку и перчатки' : 'Freezing. Don\'t forget hat and gloves');
    } else if (weather.temperature > 30) {
      recs.push(isRussian ? 'Жарко! Избегайте солнца и пейте воду' : 'Hot! Avoid sun and drink water');
    } else if (weather.temperature > 25) {
      recs.push(isRussian ? 'Тепло. Пейте больше воды' : 'Warm. Drink more water');
    }

    // Precipitation
    if (weather.precipitation > 5) {
      recs.push(isRussian ? 'Ожидаются осадки - возьмите зонт!' : 'Rain expected - take an umbrella!');
    }

    // UV Index
    if (weather.uvIndex > 7) {
      recs.push(isRussian ? 'Высокий УФ - используйте защиту' : 'High UV - use protection');
    }

    // Wind
    if (weather.windSpeed > 20) {
      recs.push(isRussian ? 'Сильный ветер сегодня' : 'Strong wind today');
    }

    return recs;
  }, []);

  // Get weather icon emoji
  const getWeatherEmoji = useCallback((code: number): string => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 55) return '🌧️';
    if (code <= 65) return '🌧️';
    if (code <= 75) return '❄️';
    if (code <= 82) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  }, []);

  // Send weather notification
  const sendWeatherNotification = useCallback(async (isRussian: boolean = true) => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // Get user's location
      const cachedLocation = localStorage.getItem('user_location_cache');
      let lat = 55.7558;
      let lon = 37.6173;

      if (cachedLocation) {
        const parsed = JSON.parse(cachedLocation);
        lat = parsed.lat;
        lon = parsed.lon;
      }

      // Fetch weather
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,uv_index,precipitation&timezone=auto`
      );
      const data = await response.json();

      const weather: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        uvIndex: data.current.uv_index || 0,
        precipitation: data.current.precipitation || 0,
      };

      const recommendations = getWeatherRecommendations(weather, isRussian);
      const emoji = getWeatherEmoji(weather.weatherCode);

      const title = isRussian 
        ? `${emoji} Погода сегодня: ${weather.temperature}°C`
        : `${emoji} Weather today: ${weather.temperature}°C`;

      const body = recommendations.length > 0
        ? recommendations.join('. ')
        : (isRussian ? 'Хорошего дня!' : 'Have a great day!');

      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'weather-notification',
        requireInteraction: false,
      });

      // Save last notification time
      localStorage.setItem(LAST_NOTIFICATION_KEY, new Date().toISOString());

      return true;
    } catch (error) {
      console.error('Error sending weather notification:', error);
      return false;
    }
  }, [permissionGranted, requestPermission, getWeatherRecommendations, getWeatherEmoji]);

  // Enable/disable notifications
  const toggleNotifications = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    }

    setIsEnabled(enabled);
    const settings = { enabled, time: notificationTime };
    localStorage.setItem(WEATHER_NOTIFICATION_KEY, JSON.stringify(settings));
    return true;
  }, [requestPermission, notificationTime]);

  // Update notification time
  const updateNotificationTime = useCallback((time: string) => {
    setNotificationTime(time);
    const settings = { enabled: isEnabled, time };
    localStorage.setItem(WEATHER_NOTIFICATION_KEY, JSON.stringify(settings));
  }, [isEnabled]);

  // Check and send scheduled notification
  useEffect(() => {
    if (!isEnabled || !user) return;

    const checkAndSend = () => {
      const now = new Date();
      const [hours, minutes] = notificationTime.split(':').map(Number);
      
      // Check if it's the right time (within 1 minute window)
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        // Check if we already sent today
        const lastNotification = localStorage.getItem(LAST_NOTIFICATION_KEY);
        if (lastNotification) {
          const lastDate = new Date(lastNotification);
          if (lastDate.toDateString() === now.toDateString()) {
            return; // Already sent today
          }
        }

        // Get language preference
        const langPref = localStorage.getItem('user_language');
        const isRussian = langPref === 'ru' || !langPref;
        
        sendWeatherNotification(isRussian);
      }
    };

    // Check immediately
    checkAndSend();

    // Check every minute
    const interval = setInterval(checkAndSend, 60000);

    return () => clearInterval(interval);
  }, [isEnabled, notificationTime, user, sendWeatherNotification]);

  return {
    isEnabled,
    notificationTime,
    permissionGranted,
    toggleNotifications,
    updateNotificationTime,
    sendWeatherNotification,
    requestPermission,
  };
}
