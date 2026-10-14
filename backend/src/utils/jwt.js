// JWT utility functions for token generation and verification
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate a JWT access token
 * @param {Object} payload - Token payload (typically user ID and email)
 * @param {Object} options - Additional JWT options
 * @returns {string} Signed JWT token
 */
export function generateToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Generate a refresh token (longer expiry)
 * @param {Object} payload - Token payload
 * @returns {string} Signed refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '30d',
  });
}

/**
 * Verify a refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  generateRefreshToken,
  verifyRefreshToken,
};