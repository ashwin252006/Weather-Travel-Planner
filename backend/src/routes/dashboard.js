// Dashboard routes - Dashboard endpoints
import { Router } from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get complete dashboard data
router.get('/', dashboardController.getDashboard);

// Get user summary
router.get('/summary', dashboardController.getUserSummary);

// Get user statistics
router.get('/stats', dashboardController.getUserStats);

// Get weather for multiple favorites
router.post('/favorites/weather', dashboardController.getFavoritesWeather);

export default router;