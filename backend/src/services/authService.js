// Auth service - User authentication and management
import bcrypt from 'bcryptjs';
import { query, queryOne, insert, transaction } from '../config/database.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { AuthenticationError, ConflictError, ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Authentication service for user registration, login, and token management
 */
class AuthService {
  // Password hashing cost factor
  static BCRYPT_COST = 12;

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user with token
   */
  async register({ name, email, password }) {
    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, AuthService.BCRYPT_COST);

    // Insert user
    const userId = await insert(
      `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
      [name.trim(), email.toLowerCase(), passwordHash]
    );

    // Get created user (without password)
    const user = await queryOne(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user,
      token,
    };
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data with token
   */
  async login(email, password) {
    // Find user by email
    const user = await queryOne(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    const user = await queryOne(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updates - Fields to update (name, email)
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updates) {
    const allowedFields = ['name', 'email'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'email') {
          // Check if email is already taken
          const existing = await queryOne(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [value.toLowerCase(), userId]
          );
          if (existing) {
            throw new ConflictError('Email is already in use');
          }
          updateFields.push('email = ?');
          values.push(value.toLowerCase());
        } else {
          updateFields.push(`${key} = ?`);
          values.push(value.trim());
        }
      }
    }

    if (updateFields.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    values.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return this.getProfile(userId);
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await queryOne(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, AuthService.BCRYPT_COST);

    await query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, userId]
    );
  }

  /**
   * Verify JWT token and return user
   * @param {string} token - JWT token
   * @returns {Promise<Object|null>} User data or null if invalid
   */
  async verifyToken(token) {
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = await queryOne(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    return user;
  }

  /**
   * Delete user account
   * @param {number} userId - User ID
   * @param {string} password - User password for confirmation
   * @returns {Promise<void>}
   */
  async deleteAccount(userId, password) {
    const user = await queryOne(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AuthenticationError('Password is incorrect');
    }

    await query('DELETE FROM users WHERE id = ?', [userId]);
  }
}

export const authService = new AuthService();
export default authService;