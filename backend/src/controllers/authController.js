// Auth controller - Handle authentication endpoints
import { asyncHandler } from '../middleware/errorHandler.js';
import { authService } from '../services/authService.js';
import { successResponse, createdResponse, errorResponse } from '../utils/response.js';
import { authSchemas } from '../utils/validation.js';
import { validate } from '../utils/validation.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = [
  validate(authSchemas.register),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.validatedBody;

    const result = await authService.register({ name, email, password });

    // Set token as HTTP-only cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return createdResponse(res, {
      user: result.user,
      token: result.token,
    }, 'Registration successful');
  }),
];

/**
 * Login user
 * POST /api/auth/login
 */
export const login = [
  validate(authSchemas.login),
  asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.validatedBody;

    const result = await authService.login(email, password);

    // Set token as HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
    };

    res.cookie('token', result.token, cookieOptions);

    return successResponse(res, {
      user: result.user,
      token: result.token,
    }, 'Login successful');
  }),
];

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return successResponse(res, null, 'Logged out successfully');
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  // User is attached by authenticate middleware
  return successResponse(res, req.user, 'Profile retrieved successfully');
});

/**
 * Update user profile
 * PUT /api/auth/me
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await authService.updateProfile(req.user.id, { name, email });

  return successResponse(res, user, 'Profile updated successfully');
});

/**
 * Change password
 * PUT /api/auth/password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return errorResponse(res, 'All fields are required', 400, 'MISSING_FIELDS');
  }

  if (newPassword !== confirmPassword) {
    return errorResponse(res, 'New passwords do not match', 400, 'PASSWORD_MISMATCH');
  }

  if (newPassword.length < 8) {
    return errorResponse(res, 'New password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
  }

  await authService.changePassword(req.user.id, currentPassword, newPassword);

  return successResponse(res, null, 'Password changed successfully');
});

/**
 * Delete account
 * DELETE /api/auth/me
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return errorResponse(res, 'Password is required to delete account', 400, 'MISSING_PASSWORD');
  }

  await authService.deleteAccount(req.user.id, password);

  // Clear token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return successResponse(res, null, 'Account deleted successfully');
});

/**
 * Refresh token (get new token with same payload)
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;

  const token = await authService.verifyToken(req.token);
  if (!token) {
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  // Generate new token
  const newToken = await authService.generateToken({ userId: user.id, email: user.email });

  // Set new token cookie
  res.cookie('token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, { token: newToken }, 'Token refreshed successfully');
});

export default {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  refreshToken,
};