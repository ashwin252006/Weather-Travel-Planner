// Auth routes - Authentication endpoints
import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);
router.delete('/me', authenticate, authController.deleteAccount);
router.post('/refresh', authenticate, authController.refreshToken);

export default router;