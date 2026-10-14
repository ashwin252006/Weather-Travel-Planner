// Validation schemas using Joi
import Joi from 'joi';

/**
 * Common validation patterns
 */
const patterns = {
  email: Joi.string().email().lowercase().trim().max(255),
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: Joi.string().trim().min(2).max(100).pattern(/^[a-zA-Z\s'-]+$/),
  locationQuery: Joi.string().trim().min(1).max(255),
  date: Joi.date().iso(),
  positiveInteger: Joi.number().integer().positive(),
  nonNegativeInteger: Joi.number().integer().min(0),
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  register: Joi.object({
    name: patterns.name.required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
      'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
    }),
    email: patterns.email.required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
    password: patterns.password.required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Please confirm your password',
    }),
  }),

  login: Joi.object({
    email: patterns.email.required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
    }),
    rememberMe: Joi.boolean().default(false),
  }),
};

/**
 * Weather validation schemas
 */
export const weatherSchemas = {
  current: Joi.object({
    location: patterns.locationQuery.required().messages({
      'string.empty': 'Location is required',
    }),
    unit: Joi.string().valid('celsius', 'fahrenheit', 'metric', 'imperial').default('celsius'),
  }),

  forecast: Joi.object({
    location: patterns.locationQuery.required().messages({
      'string.empty': 'Location is required',
    }),
    days: patterns.positiveInteger.max(10).default(3).messages({
      'number.max': 'Forecast days cannot exceed 10',
    }),
    unit: Joi.string().valid('celsius', 'fahrenheit', 'metric', 'imperial').default('celsius'),
  }),

  search: Joi.object({
    query: patterns.locationQuery.required().messages({
      'string.empty': 'Search query is required',
    }),
  }),

  compare: Joi.object({
    locations: Joi.string().required().messages({
      'string.empty': 'At least two locations are required for comparison',
    }),
    unit: Joi.string().valid('celsius', 'fahrenheit', 'metric', 'imperial').default('celsius'),
  }).custom((value, helpers) => {
    const locations = value.locations.split(',').map(l => l.trim()).filter(Boolean);
    if (locations.length < 2) {
      return helpers.error('any.custom', { message: 'At least two locations are required for comparison' });
    }
    if (locations.length > 5) {
      return helpers.error('any.custom', { message: 'Cannot compare more than 5 locations at once' });
    }
    return value;
  }),
};

/**
 * Favorites validation schemas
 */
export const favoritesSchemas = {
  create: Joi.object({
    locationName: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'Location name is required',
    }),
    country: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Country is required',
    }),
    region: Joi.string().trim().max(100).allow('').optional(),
    providerLocationId: Joi.string().trim().max(100).allow('').optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lon: Joi.number().min(-180).max(180).optional(),
  }),

  update: Joi.object({
    locationName: Joi.string().trim().min(1).max(255).optional(),
    country: Joi.string().trim().min(1).max(100).optional(),
    region: Joi.string().trim().max(100).allow('').optional(),
    providerLocationId: Joi.string().trim().max(100).allow('').optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lon: Joi.number().min(-180).max(180).optional(),
  }).min(1),
};

/**
 * Travel plans validation schemas
 */
export const travelPlansSchemas = {
  create: Joi.object({
    destination: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'Destination is required',
    }),
    destinationCountry: Joi.string().trim().max(100).allow('').optional(),
    startDate: patterns.date.required().messages({
      'date.base': 'Start date is required and must be a valid date',
      'date.format': 'Start date must be in YYYY-MM-DD format',
    }),
    endDate: patterns.date.required().messages({
      'date.base': 'End date is required and must be a valid date',
      'date.format': 'End date must be in YYYY-MM-DD format',
    }),
    notes: Joi.string().trim().max(2000).allow('').optional(),
  }).custom((value, helpers) => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return helpers.error('any.custom', { message: 'Start date cannot be in the past' });
    }
    if (end < start) {
      return helpers.error('any.custom', { message: 'End date must be after or equal to start date' });
    }
    // Max trip duration: 1 year
    const maxDuration = 365 * 24 * 60 * 60 * 1000;
    if (end - start > maxDuration) {
      return helpers.error('any.custom', { message: 'Trip duration cannot exceed 365 days' });
    }
    return value;
  }),

  update: Joi.object({
    destination: Joi.string().trim().min(1).max(255).optional(),
    destinationCountry: Joi.string().trim().max(100).allow('').optional(),
    startDate: patterns.date.optional(),
    endDate: patterns.date.optional(),
    notes: Joi.string().trim().max(2000).allow('').optional(),
  }).min(1).custom((value, helpers) => {
    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (end < start) {
        return helpers.error('any.custom', { message: 'End date must be after or equal to start date' });
      }
    }
    return value;
  }),
};

/**
 * Pagination validation schema
 */
export const paginationSchema = Joi.object({
  page: patterns.positiveInteger.default(1),
  limit: patterns.positiveInteger.max(100).default(10),
  sortBy: Joi.string().trim().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Validate request body against schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    req.validatedBody = value;
    next();
  };
}

/**
 * Validate query parameters against schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    req.validatedQuery = value;
    next();
  };
}

/**
 * Validate route parameters against schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Invalid route parameters',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    req.validatedParams = value;
    next();
  };
}

export default {
  authSchemas,
  weatherSchemas,
  favoritesSchemas,
  travelPlansSchemas,
  paginationSchema,
  validate,
  validateQuery,
  validateParams,
  patterns,
};