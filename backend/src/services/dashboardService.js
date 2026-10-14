// Dashboard service - Aggregate data for user dashboard
import { queryOne } from '../config/database.js';
import { favoritesService } from './favoritesService.js';
import { travelPlansService } from './travelPlansService.js';
import { searchHistoryService } from './searchHistoryService.js';
import { weatherService } from './weatherService.js';

/**
 * Dashboard service for aggregating user data
 */
class DashboardService {
  /**
   * Get complete dashboard data for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(userId) {
    const [
      user,
      favorites,
      travelPlans,
      recentSearches,
      stats,
    ] = await Promise.all([
      this.getUserSummary(userId),
      favoritesService.getFavoritesWithWeather(userId, { limit: 5 }),
      travelPlansService.getDashboardPlans(userId),
      searchHistoryService.getRecentSearches(userId, 5),
      this.getUserStats(userId),
    ]);

    return {
      user,
      favorites,
      travelPlans,
      recentSearches,
      stats,
    };
  }

  /**
   * Get user summary
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User summary
   */
  async getUserSummary(userId) {
    const user = await queryOne(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      memberSince: user.created_at,
    };
  }

  /**
   * Get user statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User stats
   */
  async getUserStats(userId) {
    const result = await queryOne(
      `SELECT
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favorites_count,
        (SELECT COUNT(*) FROM travel_plans WHERE user_id = ?) as travel_plans_count,
        (SELECT COUNT(*) FROM travel_plans WHERE user_id = ? AND end_date >= CURDATE()) as upcoming_plans_count,
        (SELECT COUNT(*) FROM travel_plans WHERE user_id = ? AND end_date < CURDATE()) as past_plans_count,
        (SELECT COUNT(*) FROM search_history WHERE user_id = ?) as searches_count,
        (SELECT MAX(searched_at) FROM search_history WHERE user_id = ?) as last_search_at`,
      [userId, userId, userId, userId, userId, userId]
    );

    return result;
  }

  /**
   * Get weather for multiple dashboard favorites at once
   * @param {number} userId - User ID
   * @param {Array<number>} favoriteIds - Favorite IDs
   * @returns {Promise<Array>} Favorites with weather
   */
  async getMultipleFavoritesWeather(userId, favoriteIds) {
    if (!favoriteIds || favoriteIds.length === 0) {
      return [];
    }

    // Get favorites details
    const placeholders = favoriteIds.map(() => '?').join(',');
    const favorites = await query(
      `SELECT id, location_name, country, provider_location_id
       FROM favorites
       WHERE id IN (${placeholders}) AND user_id = ?`,
      [...favoriteIds, userId]
    );

    // Fetch weather for each
    const promises = favorites.map(async (fav) => {
      try {
        const locationQuery = fav.provider_location_id || `${fav.location_name},${fav.country}`;
        const weather = await weatherService.getCurrentWeather(locationQuery);
        return { ...fav, weather };
      } catch (error) {
        return { ...fav, weather: null, weatherError: error.message };
      }
    });

    return Promise.all(promises);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;