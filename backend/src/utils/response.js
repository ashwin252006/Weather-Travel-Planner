// Standardized API response utilities

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted response
 */
export function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {any} details - Additional error details
 * @returns {Object} Formatted error response
 */
export function errorResponse(res, message = 'Internal server error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    message,
    code,
    ...(details && { details }),
  };
  return res.status(statusCode).json(response);
}

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info (page, limit, total, totalPages)
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
export function paginatedResponse(res, data = [], pagination = {}, message = 'Success') {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 0,
      hasNext: pagination.page < pagination.totalPages,
      hasPrev: pagination.page > 1,
    },
  };
  return res.status(200).json(response);
}

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {any} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} Formatted response
 */
export function createdResponse(res, data, message = 'Resource created successfully') {
  return successResponse(res, data, message, 201);
}

/**
 * No content response (204)
 * @param {Object} res - Express response object
 * @returns {Object} Empty response
 */
export function noContentResponse(res) {
  return res.status(204).send();
}

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
};