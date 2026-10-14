// Travel plans controller - Handle travel plans endpoints
import { asyncHandler } from '../middleware/errorHandler.js';
import { travelPlansService } from '../services/travelPlansService.js';
import { successResponse, createdResponse, errorResponse, noContentResponse } from '../utils/response.js';
import { travelPlansSchemas, paginationSchema } from '../utils/validation.js';
import { validate, validateQuery } from '../utils/validation.js';

/**
 * Get all travel plans for current user
 * GET /api/travel-plans
 */
export const getTravelPlans = [
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder, status } = req.validatedQuery;

    const result = await travelPlansService.getTravelPlans(req.user.id, {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
    });

    return successResponse(res, result.data, 'Travel plans retrieved successfully', 200, result.pagination);
  }),
];

/**
 * Get travel plans for dashboard
 * GET /api/travel-plans/dashboard
 */
export const getDashboardPlans = asyncHandler(async (req, res) => {
  const plans = await travelPlansService.getDashboardPlans(req.user.id);

  return successResponse(res, plans, 'Dashboard travel plans retrieved successfully');
});

/**
 * Get a single travel plan
 * GET /api/travel-plans/:id
 */
export const getTravelPlan = asyncHandler(async (req, res) => {
  const plan = await travelPlansService.getTravelPlanById(req.user.id, req.params.id);

  return successResponse(res, plan, 'Travel plan retrieved successfully');
});

/**
 * Get travel plan with forecast
 * GET /api/travel-plans/:id/forecast
 */
export const getTravelPlanWithForecast = asyncHandler(async (req, res) => {
  const { unit = 'celsius' } = req.query;

  const plan = await travelPlansService.getTravelPlanWithForecast(req.user.id, req.params.id, { unit });

  return successResponse(res, plan, 'Travel plan with forecast retrieved successfully');
});

/**
 * Create a new travel plan
 * POST /api/travel-plans
 */
export const createTravelPlan = [
  validate(travelPlansSchemas.create),
  asyncHandler(async (req, res) => {
    const plan = await travelPlansService.createTravelPlan(req.user.id, req.validatedBody);

    return createdResponse(res, plan, 'Travel plan created successfully');
  }),
];

/**
 * Update a travel plan
 * PUT /api/travel-plans/:id
 */
export const updateTravelPlan = [
  validate(travelPlansSchemas.update),
  asyncHandler(async (req, res) => {
    const plan = await travelPlansService.updateTravelPlan(req.user.id, req.params.id, req.validatedBody);

    return successResponse(res, plan, 'Travel plan updated successfully');
  }),
];

/**
 * Delete a travel plan
 * DELETE /api/travel-plans/:id
 */
export const deleteTravelPlan = asyncHandler(async (req, res) => {
  await travelPlansService.deleteTravelPlan(req.user.id, req.params.id);

  return noContentResponse(res);
});

/**
 * Get upcoming travel plans count
 * GET /api/travel-plans/count/upcoming
 */
export const getUpcomingCount = asyncHandler(async (req, res) => {
  const count = await travelPlansService.getUpcomingCount(req.user.id);

  return successResponse(res, { count }, 'Upcoming plans count retrieved');
});

/**
 * Get past travel plans count
 * GET /api/travel-plans/count/past
 */
export const getPastCount = asyncHandler(async (req, res) => {
  const count = await travelPlansService.getPastCount(req.user.id);

  return successResponse(res, { count }, 'Past plans count retrieved');
});

export default {
  getTravelPlans,
  getDashboardPlans,
  getTravelPlan,
  getTravelPlanWithForecast,
  createTravelPlan,
  updateTravelPlan,
  deleteTravelPlan,
  getUpcomingCount,
  getPastCount,
};