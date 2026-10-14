// Search history controller - Handle search history endpoints
import { asyncHandler } from '../middleware/errorHandler.js';
import { searchHistoryService } from '../services/searchHistoryService.js';
import { successResponse, errorResponse, noContentResponse } from '../utils/response.js';
import { paginationSchema } from '../utils/validation.js';
import { validateQuery } from '../utils/validation.js';

/**
 * Get search history for current user
 * GET /api/search-history
 */
export const getSearchHistory = [
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.validatedQuery;

    const result = await searchHistoryService.getSearchHistory(req.user.id, { page, limit });

    return successResponse(res, result.data, 'Search history retrieved successfully', 200, result.pagination);
  }),
];

/**
 * Get recent searches for autocomplete
 * GET /api/search-history/recent
 */
export const getRecentSearches = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const searches = await searchHistoryService.getRecentSearches(req.user.id, parseInt(limit, 10));

  return successResponse(res, searches, 'Recent searches retrieved successfully');
});

/**
 * Clear all search history
 * DELETE /api/search-history
 */
export const clearSearchHistory = asyncHandler(async (req, res) => {
  await searchHistoryService.clearHistory(req.user.id);

  return successResponse(res, null, 'Search history cleared successfully');
});

/**
 * Delete a specific search entry
 * DELETE /api/search-history/:id
 */
export const deleteSearchEntry = asyncHandler(async (req, res) => {
  await searchHistoryService.deleteEntry(req.user.id, req.params.id);

  return noContentResponse(res);
});

export default {
  getSearchHistory,
  getRecentSearches,
  clearSearchHistory,
  deleteSearchEntry,
};