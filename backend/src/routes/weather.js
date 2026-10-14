// Weather routes - Weather endpoints
import { Router } from 'express';
import weatherController from '../controllers/weatherController.js';
import { optionalAuth } from '../middleware/auth.js';
import { weatherRateLimiter, searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All weather routes use optional auth (for search history tracking)
// and rate limiting

// Current weather
router.get('/current', optionalAuth, weatherRateLimiter, weatherController.getCurrentWeather);

// Forecast
router.get('/forecast', optionalAuth, weatherRateLimiter, weatherController.getForecast);

// Location search (autocomplete)
router.get('/search', optionalAuth, searchRateLimiter, weatherController.searchLocations);

// Compare locations
router.get('/compare', optionalAuth, weatherRateLimiter, weatherController.compareLocations);

// Marine forecast
router.get('/marine', optionalAuth, weatherRateLimiter, weatherController.getMarineForecast);

// Astronomy data
router.get('/astronomy', optionalAuth, weatherRateLimiter, weatherController.getAstronomy);

// Weather alerts
router.get('/alerts', optionalAuth, weatherRateLimiter, weatherController.getAlerts);

export default router;