// Favorites controller - Handle favorites endpoints
import { asyncHandler } from '../middleware/errorHandler.js';
import { favoritesService } from '../services/favoritesService.js';
import { successResponse, createdResponse, errorResponse, noContentResponse } from '../utils/response.js';
import { favoritesSchemas } from '../utils/validation.js';
import { validate } from '../utils/validation.js';

/**
 * Get all favorites for current user
 * GET /api/favorites
 */
export const getFavorites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

  const result = await favoritesService.getFavorites(req.user.id, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy,
    sortOrder,
  });

  return successResponse(res, result.data, 'Favorites retrieved successfully', 200, result.pagination);
});

/**
 * Get favorites with current weather (for dashboard)
 * GET /api/favorites/with-weather
 */
export const getFavoritesWithWeather = asyncHandler(async (req, res) => {
  const { unit = 'celsius' } = req.query;

  const favorites = await favoritesService.getFavoritesWithWeather(req.user.id, { unit });

  return successResponse(res, favorites, 'Favorites with weather retrieved successfully');
});

/**
 * Get a single favorite with weather
 * GET /api/favorites/:id/weather
 */
export const getFavoriteWithWeather = asyncHandler(async (req, res) => {
  const { unit = 'celsius' } = req.query;

  const favorite = await favoritesService.getFavoriteWithWeather(req.user.id, req.params.id, { unit });

  return successResponse(res, favorite, 'Favorite with weather retrieved successfully');
});

/**
 * Add a new favorite
 * POST /api/favorites
 */
export const addFavorite = [
  validate(favoritesSchemas.create),
  asyncHandler(async (req, res) => {
    const favorite = await favoritesService.addFavorite(req.user.id, req.validatedBody);

    return createdResponse(res, favorite, 'Destination added to favorites');
  }),
];

/**
 * Remove a favorite
 * DELETE /api/favorites/:id
 */
export const removeFavorite = asyncHandler(async (req, res) => {
  await favoritesService.removeFavorite(req.user.id, req.params.id);

  return noContentResponse(res);
});

/**
 * Check if a location is favorited
 * GET /api/favorites/check
 */
export const checkFavorite = asyncHandler(async (req, res) => {
  const { locationName, country } = req.query;

  if (!locationName || !country) {
    return errorResponse(res, 'locationName and country are required', 400, 'MISSING_PARAMETERS');
  }

  const isFavorited = await favoritesService.isFavorited(req.user.id, locationName, country);

  return successResponse(res, { isFavorited }, 'Favorite status checked');
});

/**
 * Get favorite count
 * GET /api/favorites/count
 */
export const getFavoriteCount = asyncHandler(async (req, res) => {
  const count = await favoritesService.getFavoriteCount(req.user.id);

  return successResponse(res, { count }, 'Favorite count retrieved');
});

export default {
  getFavorites,
  getFavoritesWithWeather,
  getFavoriteWithWeather,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getFavoriteCount,
};