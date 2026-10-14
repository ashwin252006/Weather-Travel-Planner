// Favorites service - Manage user's favorite destinations
import { query, queryOne, insert } from '../config/database.js';
import { NotFoundError, ConflictError, AuthorizationError } from '../utils/errors.js';
import { weatherService } from './weatherService.js';

/**
 * Favorites service for managing user's favorite destinations
 */
class FavoritesService {
  /**
   * Get all favorites for a user
   * @param {number} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated favorites
   */
  async getFavorites(userId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'location_name', 'country'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get total count
    const countResult = await queryOne(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
      [userId]
    );
    const total = countResult.total;

    // Get favorites
    const favorites = await query(
      `SELECT id, location_name, country, region, provider_location_id, lat, lon, created_at
       FROM favorites
       WHERE user_id = ?
       ORDER BY ${sortField} ${sortDir}
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return {
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add a new favorite destination
   * @param {number} userId - User ID
   * @param {Object} favoriteData - Favorite data
   * @returns {Promise<Object>} Created favorite
   */
  async addFavorite(userId, favoriteData) {
    const { locationName, country, region, providerLocationId, lat, lon } = favoriteData;

    // Check for duplicate
    const existing = await queryOne(
      'SELECT id FROM favorites WHERE user_id = ? AND location_name = ? AND country = ?',
      [userId, locationName.trim(), country.trim()]
    );

    if (existing) {
      throw new ConflictError('This destination is already in your favorites');
    }

    // Insert favorite
    const favoriteId = await insert(
      `INSERT INTO favorites (user_id, location_name, country, region, provider_location_id, lat, lon)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, locationName.trim(), country.trim(), region?.trim() || null, providerLocationId?.trim() || null, lat, lon]
    );

    return this.getFavoriteById(userId, favoriteId);
  }

  /**
   * Get a single favorite by ID (with ownership check)
   * @param {number} userId - User ID
   * @param {number} favoriteId - Favorite ID
   * @returns {Promise<Object>} Favorite data
   */
  async getFavoriteById(userId, favoriteId) {
    const favorite = await queryOne(
      `SELECT id, location_name, country, region, provider_location_id, lat, lon, created_at
       FROM favorites
       WHERE id = ? AND user_id = ?`,
      [favoriteId, userId]
    );

    if (!favorite) {
      throw new NotFoundError('Favorite not found');
    }

    return favorite;
  }

  /**
   * Remove a favorite
   * @param {number} userId - User ID
   * @param {number} favoriteId - Favorite ID
   * @returns {Promise<void>}
   */
  async removeFavorite(userId, favoriteId) {
    const favorite = await this.getFavoriteById(userId, favoriteId);

    await query(
      'DELETE FROM favorites WHERE id = ? AND user_id = ?',
      [favoriteId, userId]
    );
  }

  /**
   * Get favorite with current weather
   * @param {number} userId - User ID
   * @param {number} favoriteId - Favorite ID
   * @param {Object} options - Weather options
   * @returns {Promise<Object>} Favorite with weather data
   */
  async getFavoriteWithWeather(userId, favoriteId, options = {}) {
    const favorite = await this.getFavoriteById(userId, favoriteId);

    try {
      const locationQuery = favorite.providerLocationId || `${favorite.location_name},${favorite.country}`;
      const weather = await weatherService.getCurrentWeather(locationQuery, options);
      return { ...favorite, weather };
    } catch (error) {
      // Return favorite even if weather fetch fails
      return { ...favorite, weather: null, weatherError: error.message };
    }
  }

  /**
   * Get all favorites with current weather (for dashboard)
   * @param {number} userId - User ID
   * @param {Object} options - Weather options
   * @returns {Promise<Array>} Favorites with weather
   */
  async getFavoritesWithWeather(userId, options = {}) {
    const { data: favorites } = await this.getFavorites(userId, { limit: 10 });

    const promises = favorites.map(favorite =>
      this.getFavoriteWithWeather(userId, favorite.id, options)
        .catch(error => ({ ...favorite, weather: null, weatherError: error.message }))
    );

    return Promise.all(promises);
  }

  /**
   * Check if a location is already favorited
   * @param {number} userId - User ID
   * @param {string} locationName - Location name
   * @param {string} country - Country
   * @returns {Promise<boolean>} True if favorited
   */
  async isFavorited(userId, locationName, country) {
    const favorite = await queryOne(
      'SELECT id FROM favorites WHERE user_id = ? AND location_name = ? AND country = ?',
      [userId, locationName.trim(), country.trim()]
    );
    return !!favorite;
  }

  /**
   * Get favorite count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of favorites
   */
  async getFavoriteCount(userId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );
    return result.count;
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;