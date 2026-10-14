// Weather service - Integration with WeatherAPI.com
import axios from 'axios';
import config from '../config/index.js';
import { query, queryOne, insert } from '../config/database.js';
import { ExternalServiceError, ValidationError } from '../utils/errors.js';

/**
 * Weather service for fetching weather data from WeatherAPI.com
 * Includes caching to reduce API calls and improve performance
 */
class WeatherService {
  constructor() {
    this.client = axios.create({
      baseURL: config.weatherApi.baseUrl,
      timeout: config.weatherApi.timeout,
      params: {
        key: config.weatherApi.apiKey,
      },
    });

    // In-memory cache for development (in production, use Redis)
    this.cache = new Map();
  }

  /**
   * Build cache key from parameters
   */
  buildCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get cached response if valid
   */
  getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  /**
   * Cache response with TTL
   */
  setCachedResponse(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + config.weatherApi.cacheTtl * 1000,
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get current weather for a location
   * @param {string} location - Location query (city name, lat/lon, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Current weather data
   */
  async getCurrentWeather(location, options = {}) {
    const { unit = 'celsius', useCache = true } = options;

    const params = {
      q: location,
      aqi: 'yes', // Include air quality data
    };

    const cacheKey = this.buildCacheKey('current', params);

    if (useCache) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return this.transformCurrentResponse(cached, unit);
      }
    }

    try {
      const response = await this.client.get('/current.json', { params });
      const data = response.data;

      if (useCache) {
        this.setCachedResponse(cacheKey, data);
      }

      return this.transformCurrentResponse(data, unit);
    } catch (error) {
      throw this.handleApiError(error, 'current weather');
    }
  }

  /**
   * Get weather forecast for a location
   * @param {string} location - Location query
   * @param {Object} options - Options including days and unit
   * @returns {Promise<Object>} Forecast data
   */
  async getForecast(location, options = {}) {
    const { days = 3, unit = 'celsius', useCache = true } = options;

    // WeatherAPI free plan supports up to 3 days, paid up to 10
    const forecastDays = Math.min(Math.max(1, days), 10);

    const params = {
      q: location,
      days: forecastDays,
      aqi: 'no',
      alerts: 'yes', // Include weather alerts if available
    };

    const cacheKey = this.buildCacheKey('forecast', params);

    if (useCache) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return this.transformForecastResponse(cached, unit);
      }
    }

    try {
      const response = await this.client.get('/forecast.json', { params });
      const data = response.data;

      if (useCache) {
        this.setCachedResponse(cacheKey, data);
      }

      return this.transformForecastResponse(data, unit);
    } catch (error) {
      throw this.handleApiError(error, 'forecast');
    }
  }

  /**
   * Search for locations (autocomplete)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Location suggestions
   */
  async searchLocations(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const params = { q: query.trim() };
    const cacheKey = this.buildCacheKey('search', params);

    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return this.transformSearchResponse(cached);
    }

    try {
      const response = await this.client.get('/search.json', { params });
      const data = response.data;

      this.setCachedResponse(cacheKey, data);
      return this.transformSearchResponse(data);
    } catch (error) {
      throw this.handleApiError(error, 'location search');
    }
  }

  /**
   * Get weather for multiple locations (comparison)
   * @param {Array<string>} locations - Array of location queries
   * @param {Object} options - Options including unit
   * @returns {Promise<Array>} Array of current weather data
   */
  async compareLocations(locations, options = {}) {
    const { unit = 'celsius' } = options;

    if (!locations || locations.length < 2) {
      throw new ValidationError('At least two locations required for comparison');
    }

    if (locations.length > 5) {
      throw new ValidationError('Cannot compare more than 5 locations at once');
    }

    const promises = locations.map(location =>
      this.getCurrentWeather(location, { unit, useCache: true })
        .catch(error => ({ error: error.message, location }))
    );

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * Get marine/tide forecast (if supported by plan)
   * @param {string} location - Location query
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Marine forecast data
   */
  async getMarineForecast(location, days = 3) {
    const params = {
      q: location,
      days: Math.min(Math.max(1, days), 7),
    };

    try {
      const response = await this.client.get('/marine.json', { params });
      return response.data;
    } catch (error) {
      // Marine endpoint may not be available on all plans
      if (error.response?.status === 403) {
        throw new ExternalServiceError('Marine forecast not available on current plan', 403);
      }
      throw this.handleApiError(error, 'marine forecast');
    }
  }

  /**
   * Get astronomy data (sunrise, sunset, moon phases)
   * @param {string} location - Location query
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Astronomy data
   */
  async getAstronomy(location, days = 3) {
    const params = {
      q: location,
      days: Math.min(Math.max(1, days), 3),
    };

    try {
      const response = await this.client.get('/astronomy.json', { params });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'astronomy');
    }
  }

  /**
   * Transform current weather response to standardized format
   */
  transformCurrentResponse(data, unit = 'celsius') {
    const current = data.current;
    const location = data.location;
    const isFahrenheit = unit === 'fahrenheit' || unit === 'imperial';

    return {
      location: {
        name: location.name,
        country: location.country,
        region: location.region,
        lat: location.lat,
        lon: location.lon,
        tzId: location.tz_id,
        localtime: location.localtime,
      },
      current: {
        temperature: isFahrenheit ? current.temp_f : current.temp_c,
        feelsLike: isFahrenheit ? current.feelslike_f : current.feelslike_c,
        condition: {
          text: current.condition.text,
          icon: current.condition.icon,
          code: current.condition.code,
        },
        humidity: current.humidity,
        wind: {
          speed: current.wind_kph,
          speedMph: current.wind_mph,
          direction: current.wind_dir,
          degree: current.wind_degree,
          gust: current.gust_kph,
          gustMph: current.gust_mph,
        },
        pressure: {
          mb: current.pressure_mb,
          in: current.pressure_in,
        },
        visibility: {
          km: current.vis_km,
          miles: current.vis_miles,
        },
        uvIndex: current.uv,
        cloudCover: current.cloud,
        precipitation: {
          mm: current.precip_mm,
          inches: current.precip_in,
        },
        dewPoint: isFahrenheit ? current.dewpoint_f : current.dewpoint_c,
        heatIndex: isFahrenheit ? current.heatindex_f : current.heatindex_c,
        windChill: isFahrenheit ? current.windchill_f : current.windchill_c,
        lastUpdated: current.last_updated,
        lastUpdatedEpoch: current.last_updated_epoch,
      },
      airQuality: current.air_quality ? {
        co: current.air_quality.co,
        no2: current.air_quality.no2,
        o3: current.air_quality.o3,
        so2: current.air_quality.so2,
        pm2_5: current.air_quality.pm2_5,
        pm10: current.air_quality.pm10,
        usEpaIndex: current.air_quality['us-epa-index'],
        gbDefraIndex: current.air_quality['gb-defra-index'],
      } : null,
      unit: isFahrenheit ? 'fahrenheit' : 'celsius',
    };
  }

  /**
   * Transform forecast response to standardized format
   */
  transformForecastResponse(data, unit = 'celsius') {
    const forecast = data.forecast;
    const location = data.location;
    const alerts = data.alerts?.alert || [];
    const isFahrenheit = unit === 'fahrenheit' || unit === 'imperial';

    return {
      location: {
        name: location.name,
        country: location.country,
        region: location.region,
        lat: location.lat,
        lon: location.lon,
        tzId: location.tz_id,
        localtime: location.localtime,
      },
      forecast: forecast.forecastday.map(day => ({
        date: day.date,
        dateEpoch: day.date_epoch,
        day: {
          maxTemp: isFahrenheit ? day.day.maxtemp_f : day.day.maxtemp_c,
          minTemp: isFahrenheit ? day.day.mintemp_f : day.day.mintemp_c,
          avgTemp: isFahrenheit ? day.day.avgtemp_f : day.day.avgtemp_c,
          maxWind: day.day.maxwind_kph,
          maxWindMph: day.day.maxwind_mph,
          totalPrecip: day.day.totalprecip_mm,
          totalPrecipIn: day.day.totalprecip_in,
          avgHumidity: day.day.avghumidity,
          dailyChanceOfRain: day.day.daily_chance_of_rain,
          dailyChanceOfSnow: day.day.daily_chance_of_snow,
          condition: {
            text: day.day.condition.text,
            icon: day.day.condition.icon,
            code: day.day.condition.code,
          },
          uvIndex: day.day.uv,
        },
        astro: day.astro ? {
          sunrise: day.astro.sunrise,
          sunset: day.astro.sunset,
          moonrise: day.astro.moonrise,
          moonset: day.astro.moonset,
          moonPhase: day.astro.moon_phase,
          moonIllumination: day.astro.moon_illumination,
        } : null,
        hours: day.hour?.map(hour => ({
          time: hour.time,
          timeEpoch: hour.time_epoch,
          temperature: isFahrenheit ? hour.temp_f : hour.temp_c,
          feelsLike: isFahrenheit ? hour.feelslike_f : hour.feelslike_c,
          condition: {
            text: hour.condition.text,
            icon: hour.condition.icon,
            code: hour.condition.code,
          },
          humidity: hour.humidity,
          wind: {
            speed: hour.wind_kph,
            speedMph: hour.wind_mph,
            direction: hour.wind_dir,
            degree: hour.wind_degree,
          },
          pressure: hour.pressure_mb,
          precipitation: {
            mm: hour.precip_mm,
            inches: hour.precip_in,
          },
          chanceOfRain: hour.chance_of_rain,
          chanceOfSnow: hour.chance_of_snow,
          cloudCover: hour.cloud,
          uvIndex: hour.uv,
          visibility: hour.vis_km,
        })) || [],
      })),
      alerts: alerts.map(alert => ({
        headline: alert.headline,
        severity: alert.severity,
        urgency: alert.urgency,
        areas: alert.areas,
        category: alert.category,
        certainty: alert.certainty,
        event: alert.event,
        note: alert.note,
        effective: alert.effective,
        expires: alert.expires,
        description: alert.desc,
        instruction: alert.instruction,
      })),
      unit: isFahrenheit ? 'fahrenheit' : 'celsius',
    };
  }

  /**
   * Transform search response to standardized format
   */
  transformSearchResponse(data) {
    return data.map(location => ({
      name: location.name,
      country: location.country,
      region: location.region,
      lat: location.lat,
      lon: location.lon,
      tzId: location.tz_id,
      url: location.url,
    }));
  }

  /**
   * Handle API errors and convert to application errors
   */
  handleApiError(error, operation) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new ValidationError(data?.error?.message || `Invalid request for ${operation}`);
        case 401:
          throw new ExternalServiceError('Invalid weather API key', 401);
        case 403:
          throw new ExternalServiceError('Weather API access forbidden - check plan limits', 403);
        case 429:
          throw new ExternalServiceError('Weather API rate limit exceeded', 429);
        case 500:
        case 502:
        case 503:
          throw new ExternalServiceError(`Weather service temporarily unavailable (${status})`, status);
        default:
          throw new ExternalServiceError(`Weather API error: ${data?.error?.message || 'Unknown error'}`);
      }
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new ExternalServiceError('Weather API request timeout', 504);
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new ExternalServiceError('Unable to connect to weather service', 503);
    }

    throw new ExternalServiceError(`Failed to fetch ${operation}: ${error.message}`);
  }

  /**
   * Get cache stats for monitoring
   */
  getCacheStats() {
    this.clearExpiredCache();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;