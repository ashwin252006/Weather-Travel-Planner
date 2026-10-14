// Error handling middleware - Centralized error handling
import config from '../config/index.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging (in development)
  if (config.server.nodeEnv === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  }

  // Handle known application errors
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Joi validation errors
  if (err.name === 'ValidationError' && err.details) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Handle MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    return handleDatabaseError(err, res);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Handle axios errors (external API)
  if (err.isAxiosError) {
    return handleAxiosError(err, res);
  }

  // Handle syntax errors (JSON parsing)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Invalid JSON payload', 400, 'INVALID_JSON');
  }

  // Default: Internal server error
  const message = config.server.nodeEnv === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return errorResponse(res, message, 500, 'INTERNAL_ERROR');
}

/**
 * Handle database errors
 */
function handleDatabaseError(err, res) {
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      // Extract field from error message
      const fieldMatch = err.message.match(/for key '(.+)'/);
      const field = fieldMatch ? fieldMatch[1] : 'field';
      return errorResponse(
        res,
        `A record with this ${field} already exists`,
        409,
        'DUPLICATE_ENTRY'
      );

    case 'ER_NO_REFERENCED_ROW':
    case 'ER_ROW_IS_REFERENCED':
      return errorResponse(
        res,
        'Referenced record does not exist or is still in use',
        400,
        'FOREIGN_KEY_VIOLATION'
      );

    case 'ER_DATA_TOO_LONG':
      return errorResponse(
        res,
        'Input data is too long for one or more fields',
        400,
        'DATA_TOO_LONG'
      );

    case 'ER_BAD_NULL_ERROR':
      return errorResponse(
        res,
        'A required field is missing',
        400,
        'MISSING_REQUIRED_FIELD'
      );

    case 'ER_ACCESS_DENIED_ERROR':
      return errorResponse(
        res,
        'Database access denied',
        500,
        'DATABASE_ACCESS_DENIED'
      );

    case 'ECONNREFUSED':
      return errorResponse(
        res,
        'Unable to connect to database',
        503,
        'DATABASE_CONNECTION_FAILED'
      );

    default:
      return errorResponse(
        res,
        'Database operation failed',
        500,
        'DATABASE_ERROR'
      );
  }
}

/**
 * Handle axios (external API) errors
 */
function handleAxiosError(err, res) {
  if (err.response) {
    const { status, data } = err.response;

    switch (status) {
      case 400:
        return errorResponse(res, data?.error?.message || 'Invalid request to external service', 400);
      case 401:
        return errorResponse(res, 'External service authentication failed', 502);
      case 403:
        return errorResponse(res, 'External service access forbidden', 502);
      case 429:
        return errorResponse(res, 'External service rate limit exceeded', 429);
      case 500:
      case 502:
      case 503:
      case 504:
        return errorResponse(res, 'External service temporarily unavailable', 503);
      default:
        return errorResponse(res, `External service error: ${data?.error?.message || 'Unknown error'}`, 502);
    }
  }

  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return errorResponse(res, 'External service request timeout', 504);
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return errorResponse(res, 'Unable to connect to external service', 503);
  }

  return errorResponse(res, 'External service error', 502);
}

/**
 * 404 handler for unknown routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function notFoundHandler(req, res) {
  return errorResponse(
    res,
    `Route ${req.method} ${req.path} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};