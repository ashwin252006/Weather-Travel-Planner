// Authentication middleware - JWT verification and user attachment
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { authService } from '../services/authService.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * Middleware to authenticate JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header or cookie
    let token = extractTokenFromHeader(req.headers.authorization);

    // Also check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AuthenticationError('Authentication token is required');
    }

    // Verify token and get user
    const user = await authService.verifyToken(token);

    if (!user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTHENTICATION_ERROR',
    });
  }
}

/**
 * Optional authentication - attach user if token is valid, but don't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = extractTokenFromHeader(req.headers.authorization);

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const user = await authService.verifyToken(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently ignore auth errors for optional auth
    next();
  }
}

/**
 * Middleware to check if user owns a resource
 * @param {Function} getResourceUserId - Function to get resource owner ID
 * @returns {Function} Express middleware
 */
export function authorize(getResourceUserId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_ERROR',
        });
      }

      const resourceUserId = await getResourceUserId(req);

      if (resourceUserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          code: 'AUTHORIZATION_ERROR',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR',
      });
    }
  };
}

export default {
  authenticate,
  optionalAuth,
  authorize,
};