// Validation middleware - Request validation using express-validator
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to handle validation results from express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  next();
}

/**
 * Sanitize request body - trim strings, remove extra whitespace
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Recursively sanitize object values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'string' ? v.trim() : v
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate required fields are present
 * @param {Array<string>} fields - Required field names
 * @returns {Function} Express middleware
 */
export function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body?.[field] ?? req.query?.[field] ?? req.params?.[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return errorResponse(
        res,
        `Missing required fields: ${missing.join(', ')}`,
        400,
        'MISSING_FIELDS',
        missing.map(f => ({ field: f, message: 'This field is required' }))
      );
    }

    next();
  };
}

/**
 * Validate ID parameter is a positive integer
 * @param {string} paramName - Parameter name (default: 'id')
 * @returns {Function} Express middleware
 */
export function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || isNaN(id) || parseInt(id, 10) <= 0) {
      return errorResponse(
        res,
        `Invalid ${paramName} parameter`,
        400,
        'INVALID_ID_PARAM',
        { field: paramName, message: 'Must be a positive integer' }
      );
    }

    req.params[paramName] = parseInt(id, 10);
    next();
  };
}

/**
 * Validate date parameters
 * @param {Array<string>} fields - Date field names
 * @returns {Function} Express middleware
 */
export function validateDates(fields) {
  return (req, res, next) => {
    const errors = [];

    for (const field of fields) {
      const value = req.body?.[field] ?? req.query?.[field];

      if (value !== undefined && value !== null && value !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push({
            field,
            message: 'Must be a valid date in YYYY-MM-DD format',
          });
        }
      }
    }

    if (errors.length > 0) {
      return errorResponse(res, 'Invalid date format', 400, 'INVALID_DATE', errors);
    }

    next();
  };
}

export default {
  handleValidationErrors,
  sanitizeBody,
  requireFields,
  validateIdParam,
  validateDates,
};