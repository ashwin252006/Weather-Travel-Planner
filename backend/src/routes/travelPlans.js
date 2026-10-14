// Travel plans routes - Travel plans endpoints
import { Router } from 'express';
import travelPlansController from '../controllers/travelPlansController.js';
import { authenticate } from '../middleware/auth.js';
import { validateIdParam } from '../middleware/validation.js';

const router = Router();

// All travel plans routes require authentication
router.use(authenticate);

// Get travel plans for dashboard
router.get('/dashboard', travelPlansController.getDashboardPlans);

// Get upcoming count
router.get('/count/upcoming', travelPlansController.getUpcomingCount);

// Get past count
router.get('/count/past', travelPlansController.getPastCount);

// Get all travel plans
router.get('/', travelPlansController.getTravelPlans);

// Get single travel plan
router.get('/:id', validateIdParam('id'), travelPlansController.getTravelPlan);

// Get travel plan with forecast
router.get('/:id/forecast', validateIdParam('id'), travelPlansController.getTravelPlanWithForecast);

// Create travel plan
router.post('/', travelPlansController.createTravelPlan);

// Update travel plan
router.put('/:id', validateIdParam('id'), travelPlansController.updateTravelPlan);

// Delete travel plan
router.delete('/:id', validateIdParam('id'), travelPlansController.deleteTravelPlan);

export default router;