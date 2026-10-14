// Favorites routes - Favorites endpoints
import { Router } from 'express';
import favoritesController from '../controllers/favoritesController.js';
import { authenticate } from '../middleware/auth.js';
import { validateIdParam } from '../middleware/validation.js';

const router = Router();

// All favorites routes require authentication
router.use(authenticate);

// Get all favorites
router.get('/', favoritesController.getFavorites);

// Get favorites with weather (for dashboard)
router.get('/with-weather', favoritesController.getFavoritesWithWeather);

// Get favorite count
router.get('/count', favoritesController.getFavoriteCount);

// Check if location is favorited
router.get('/check', favoritesController.checkFavorite);

// Get single favorite with weather
router.get('/:id/weather', validateIdParam('id'), favoritesController.getFavoriteWithWeather);

// Add favorite
router.post('/', favoritesController.addFavorite);

// Remove favorite
router.delete('/:id', validateIdParam('id'), favoritesController.removeFavorite);

export default router;