// Travel plans service - Manage user's travel plans
import { query, queryOne, insert } from '../config/database.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { weatherService } from './weatherService.js';

/**
 * Travel plans service for managing user's travel itineraries
 */
class TravelPlansService {
  /**
   * Get all travel plans for a user
   * @param {number} userId - User ID
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Paginated travel plans
   */
  async getTravelPlans(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'start_date',
      sortOrder = 'ASC',
      status, // 'upcoming', 'past', 'all'
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (status === 'upcoming') {
      whereClause += ' AND end_date >= CURDATE()';
    } else if (status === 'past') {
      whereClause += ' AND end_date < CURDATE()';
    }

    // Validate sort parameters
    const allowedSortFields = ['start_date', 'end_date', 'created_at', 'destination'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'start_date';
    const sortDir = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    // Get total count
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM travel_plans ${whereClause}`,
      params
    );
    const total = countResult.total;

    // Get travel plans
    const plans = await query(
      `SELECT id, destination, destination_country, start_date, end_date, notes, created_at, updated_at
       FROM travel_plans
       ${whereClause}
       ORDER BY ${sortField} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single travel plan by ID (with ownership check)
   * @param {number} userId - User ID
   * @param {number} planId - Travel plan ID
   * @returns {Promise<Object>} Travel plan data
   */
  async getTravelPlanById(userId, planId) {
    const plan = await queryOne(
      `SELECT id, destination, destination_country, start_date, end_date, notes, created_at, updated_at
       FROM travel_plans
       WHERE id = ? AND user_id = ?`,
      [planId, userId]
    );

    if (!plan) {
      throw new NotFoundError('Travel plan not found');
    }

    return plan;
  }

  /**
   * Create a new travel plan
   * @param {number} userId - User ID
   * @param {Object} planData - Travel plan data
   * @returns {Promise<Object>} Created travel plan
   */
  async createTravelPlan(userId, planData) {
    const { destination, destinationCountry, startDate, endDate, notes } = planData;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      throw new ValidationError('Start date cannot be in the past');
    }

    if (end < start) {
      throw new ValidationError('End date must be after or equal to start date');
    }

    // Max trip duration: 1 year
    const maxDuration = 365 * 24 * 60 * 60 * 1000;
    if (end - start > maxDuration) {
      throw new ValidationError('Trip duration cannot exceed 365 days');
    }

    // Insert travel plan
    const planId = await insert(
      `INSERT INTO travel_plans (user_id, destination, destination_country, start_date, end_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, destination.trim(), destinationCountry?.trim() || null, startDate, endDate, notes?.trim() || null]
    );

    return this.getTravelPlanById(userId, planId);
  }

  /**
   * Update a travel plan
   * @param {number} userId - User ID
   * @param {number} planId - Travel plan ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated travel plan
   */
  async updateTravelPlan(userId, planId, updates) {
    const plan = await this.getTravelPlanById(userId, planId);

    const allowedFields = ['destination', 'destination_country', 'start_date', 'end_date', 'notes'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(key === 'notes' ? value.trim() : value);
      }
    }

    if (updateFields.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Validate date changes if both are being updated
    if (updates.start_date && updates.end_date) {
      const start = new Date(updates.start_date);
      const end = new Date(updates.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        throw new ValidationError('Start date cannot be in the past');
      }
      if (end < start) {
        throw new ValidationError('End date must be after or equal to start date');
      }
    } else if (updates.start_date) {
      const start = new Date(updates.start_date);
      const end = new Date(plan.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        throw new ValidationError('Start date cannot be in the past');
      }
      if (end < start) {
        throw new ValidationError('End date must be after or equal to start date');
      }
    } else if (updates.end_date) {
      const start = new Date(plan.start_date);
      const end = new Date(updates.end_date);

      if (end < start) {
        throw new ValidationError('End date must be after or equal to start date');
      }
    }

    values.push(planId, userId);

    await query(
      `UPDATE travel_plans SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      values
    );

    return this.getTravelPlanById(userId, planId);
  }

  /**
   * Delete a travel plan
   * @param {number} userId - User ID
   * @param {number} planId - Travel plan ID
   * @returns {Promise<void>}
   */
  async deleteTravelPlan(userId, planId) {
    const plan = await this.getTravelPlanById(userId, planId);

    await query(
      'DELETE FROM travel_plans WHERE id = ? AND user_id = ?',
      [planId, userId]
    );
  }

  /**
   * Get travel plan with forecast data
   * @param {number} userId - User ID
   * @param {number} planId - Travel plan ID
   * @param {Object} options - Weather options
   * @returns {Promise<Object>} Travel plan with forecast
   */
  async getTravelPlanWithForecast(userId, planId, options = {}) {
    const plan = await this.getTravelPlanById(userId, planId);

    try {
      const locationQuery = `${plan.destination}${plan.destination_country ? `,${plan.destination_country}` : ''}`;
      const forecast = await weatherService.getForecast(locationQuery, {
        days: 10,
        ...options,
      });

      // Filter forecast to trip dates
      const tripStart = new Date(plan.start_date);
      const tripEnd = new Date(plan.end_date);

      const relevantForecast = forecast.forecast.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= tripStart && dayDate <= tripEnd;
      });

      return {
        ...plan,
        forecast: {
          ...forecast,
          forecast: relevantForecast,
          tripDatesCovered: relevantForecast.length,
          totalTripDays: Math.ceil((tripEnd - tripStart) / (1000 * 60 * 60 * 24)) + 1,
        },
      };
    } catch (error) {
      // Return plan even if forecast fetch fails
      return {
        ...plan,
        forecast: null,
        forecastError: error.message,
      };
    }
  }

  /**
   * Get upcoming travel plans count
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of upcoming plans
   */
  async getUpcomingCount(userId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM travel_plans WHERE user_id = ? AND end_date >= CURDATE()',
      [userId]
    );
    return result.count;
  }

  /**
   * Get past travel plans count
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of past plans
   */
  async getPastCount(userId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM travel_plans WHERE user_id = ? AND end_date < CURDATE()',
      [userId]
    );
    return result.count;
  }

  /**
   * Get travel plans for dashboard (next 3 upcoming + recent past)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Dashboard travel plans
   */
  async getDashboardPlans(userId) {
    const [upcoming, past] = await Promise.all([
      this.getTravelPlans(userId, { status: 'upcoming', limit: 3, sortOrder: 'ASC' }),
      this.getTravelPlans(userId, { status: 'past', limit: 3, sortOrder: 'DESC' }),
    ]);

    return {
      upcoming: upcoming.data,
      past: past.data,
    };
  }
}

export const travelPlansService = new TravelPlansService();
export default travelPlansService;