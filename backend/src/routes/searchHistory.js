// Search history routes - Search history endpoints
import { Router } from 'express';
import searchHistoryController from '../controllers/searchHistoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validateIdParam } from '../middleware/validation.js';

const router = Router();

// All search history routes require authentication
router.use(authenticate);

// Get search history
router.get('/', searchHistoryController.getSearchHistory);

// Get recent searches
router.get('/recent', searchHistoryController.getRecentSearches);

// Clear all search history
router.delete('/', searchHistoryController.clearSearchHistory);

// Delete specific search entry
router.delete('/:id', validateIdParam('id'), searchHistoryController.deleteSearchEntry);

export default router;