// Dashboard controller - Handle dashboard endpoints
import { asyncHandler } from '../middleware/errorHandler.js';
import { dashboardService } from '../services/dashboardService.js';
import { successResponse } from '../utils/response.js';

/**
 * Get complete dashboard data
 * GET /api/dashboard
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboardData(req.user.id);

  return successResponse(res, dashboard, 'Dashboard data retrieved successfully');
});

/**
 * Get user summary
 * GET /api/dashboard/summary
 */
export const getUserSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getUserSummary(req.user.id);

  return successResponse(res, summary, 'User summary retrieved successfully');
});

/**
 * Get user statistics
 * GET /api/dashboard/stats
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getUserStats(req.user.id);

  return successResponse(res, stats, 'User statistics retrieved successfully');
});

/**
 * Get weather for multiple favorites
 * POST /api/dashboard/favorites/weather
 */
export const getFavoritesWeather = asyncHandler(async (req, res) => {
  const { favoriteIds } = req.body;

  if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
    return successResponse(res, [], 'No favorites requested');
  }

  const favorites = await dashboardService.getMultipleFavoritesWeather(req.user.id, favoriteIds);

  return successResponse(res, favorites, 'Favorites weather retrieved successfully');
});

export default {
  getDashboard,
  getUserSummary,
  getUserStats,
  getFavoritesWeather,
};