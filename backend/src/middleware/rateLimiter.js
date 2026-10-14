// Rate limiting middleware
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import { errorResponse } from '../utils/response.js';

/**
 * Create a rate limiter with custom options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    skip: options.skip || (() => false),
    handler: (req, res) => {
      return errorResponse(
        res,
        options.message || 'Too many requests, please try again later',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    },
  });
}

/**
 * General API rate limiter
 */
export const apiRateLimiter = createRateLimiter();

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMaxRequests, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Rate limiter for weather API endpoints
 */
export const weatherRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many weather requests, please slow down',
});

/**
 * Rate limiter for search endpoints
 */
export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many search requests, please slow down',
});

/**
 * Rate limiter for sensitive operations (password change, account deletion)
 */
export const sensitiveOperationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many sensitive operations, please try again later',
});

/**
 * Create a custom rate limiter for specific use cases
 * @param {Object} options - Custom options
 * @returns {Function} Express middleware
 */
export function createCustomLimiter(options) {
  return createRateLimiter(options);
}

export default {
  apiRateLimiter,
  authRateLimiter,
  weatherRateLimiter,
  searchRateLimiter,
  sensitiveOperationLimiter,
  createCustomLimiter,
};