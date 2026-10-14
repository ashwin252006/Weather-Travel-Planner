// Search history service - Track user search queries
import { query, queryOne, insert } from '../config/database.js';

/**
 * Search history service for tracking user searches
 */
class SearchHistoryService {
  /**
   * Record a search query
   * @param {Object} params - Search parameters
   * @returns {Promise<void>}
   */
  async recordSearch({ userId, searchQuery, resultCount = 0 }) {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return;
    }

    await insert(
      `INSERT INTO search_history (user_id, search_query, result_count)
       VALUES (?, ?, ?)`,
      [userId || null, searchQuery.trim(), resultCount]
    );
  }

  /**
   * Get search history for a user
   * @param {number} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated search history
   */
  async getSearchHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countResult = await queryOne(
      'SELECT COUNT(*) as total FROM search_history WHERE user_id = ?',
      [userId]
    );
    const total = countResult.total;

    const history = await query(
      `SELECT id, search_query, result_count, searched_at
       FROM search_history
       WHERE user_id = ?
       ORDER BY searched_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get recent search queries (for autocomplete suggestions)
   * @param {number} userId - User ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Recent searches
   */
  async getRecentSearches(userId, limit = 10) {
    const searches = await query(
      `SELECT DISTINCT search_query, MAX(searched_at) as last_searched
       FROM search_history
       WHERE user_id = ?
       GROUP BY search_query
       ORDER BY last_searched DESC
       LIMIT ?`,
      [userId, limit]
    );

    return searches.map(s => s.search_query);
  }

  /**
   * Clear search history for a user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async clearHistory(userId) {
    await query('DELETE FROM search_history WHERE user_id = ?', [userId]);
  }

  /**
   * Delete a specific search entry
   * @param {number} userId - User ID
   * @param {number} historyId - History entry ID
   * @returns {Promise<void>}
   */
  async deleteEntry(userId, historyId) {
    await query('DELETE FROM search_history WHERE id = ? AND user_id = ?', [historyId, userId]);
  }
}

export const searchHistoryService = new SearchHistoryService();
export default searchHistoryService;