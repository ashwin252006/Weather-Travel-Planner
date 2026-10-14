// Weather controller - Handle weather endpoints
import { asyncHandler } from '../middleware/errorHandler.js';
import { weatherService } from '../services/weatherService.js';
import { searchHistoryService } from '../services/searchHistoryService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { weatherSchemas } from '../utils/validation.js';
import { validate, validateQuery } from '../utils/validation.js';

/**
 * Get current weather for a location
 * GET /api/weather/current?location=Chennai
 */
export const getCurrentWeather = [
  validateQuery(weatherSchemas.current),
  asyncHandler(async (req, res) => {
    const { location, unit } = req.validatedQuery;

    const weather = await weatherService.getCurrentWeather(location, { unit });

    // Record search history if user is authenticated
    if (req.user) {
      await searchHistoryService.recordSearch({
        userId: req.user.id,
        searchQuery: location,
        resultCount: 1,
      });
    }

    return successResponse(res, weather, 'Current weather retrieved successfully');
  }),
];

/**
 * Get weather forecast for a location
 * GET /api/weather/forecast?location=Chennai&days=3
 */
export const getForecast = [
  validateQuery(weatherSchemas.forecast),
  asyncHandler(async (req, res) => {
    const { location, days, unit } = req.validatedQuery;

    const forecast = await weatherService.getForecast(location, { days, unit });

    // Record search history if user is authenticated
    if (req.user) {
      await searchHistoryService.recordSearch({
        userId: req.user.id,
        searchQuery: `${location} forecast`,
        resultCount: forecast.forecast?.length || 0,
      });
    }

    return successResponse(res, forecast, 'Weather forecast retrieved successfully');
  }),
];

/**
 * Search for locations (autocomplete)
 * GET /api/weather/search?query=Chen
 */
export const searchLocations = [
  validateQuery(weatherSchemas.search),
  asyncHandler(async (req, res) => {
    const { query } = req.validatedQuery;

    const locations = await weatherService.searchLocations(query);

    return successResponse(res, locations, 'Location suggestions retrieved successfully');
  }),
];

/**
 * Compare multiple locations
 * GET /api/weather/compare?locations=Chennai,Bengaluru
 */
export const compareLocations = [
  validateQuery(weatherSchemas.compare),
  asyncHandler(async (req, res) => {
    const { locations, unit } = req.validatedQuery;

    // Parse comma-separated locations
    const locationArray = locations.split(',').map(l => l.trim()).filter(Boolean);

    const comparison = await weatherService.compareLocations(locationArray, { unit });

    // Record search history if user is authenticated
    if (req.user) {
      await searchHistoryService.recordSearch({
        userId: req.user.id,
        searchQuery: `compare: ${locations}`,
        resultCount: locationArray.length,
      });
    }

    return successResponse(res, comparison, 'Location comparison retrieved successfully');
  }),
];

/**
 * Get marine forecast (if available)
 * GET /api/weather/marine?location=Chennai&days=3
 */
export const getMarineForecast = [
  validateQuery(
    weatherSchemas.forecast.keys({ days: true, location: true })
  ),
  asyncHandler(async (req, res) => {
    const { location, days } = req.validatedQuery;

    const marine = await weatherService.getMarineForecast(location, days);

    return successResponse(res, marine, 'Marine forecast retrieved successfully');
  }),
];

/**
 * Get astronomy data (sunrise, sunset, moon phases)
 * GET /api/weather/astronomy?location=Chennai&days=3
 */
export const getAstronomy = [
  validateQuery(
    weatherSchemas.forecast.keys({ days: true, location: true })
  ),
  asyncHandler(async (req, res) => {
    const { location, days } = req.validatedQuery;

    const astronomy = await weatherService.getAstronomy(location, days);

    return successResponse(res, astronomy, 'Astronomy data retrieved successfully');
  }),
];

/**
 * Get weather alerts for a location
 * GET /api/weather/alerts?location=Chennai
 */
export const getAlerts = [
  validateQuery(weatherSchemas.current),
  asyncHandler(async (req, res) => {
    const { location } = req.validatedQuery;

    // Get forecast which includes alerts
    const forecast = await weatherService.getForecast(location, { days: 1 });

    return successResponse(res, forecast.alerts || [], 'Weather alerts retrieved successfully');
  }),
];

export default {
  getCurrentWeather,
  getForecast,
  searchLocations,
  compareLocations,
  getMarineForecast,
  getAstronomy,
  getAlerts,
};