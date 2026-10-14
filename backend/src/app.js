// Express app setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/index.js';

// Import middleware
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import weatherRoutes from './routes/weather.js';
import favoritesRoutes from './routes/favorites.js';
import travelPlansRoutes from './routes/travelPlans.js';
import searchHistoryRoutes from './routes/searchHistory.js';
import dashboardRoutes from './routes/dashboard.js';

// Import database test function
import { testConnection } from './config/database.js';

/**
 * Create and configure Express application
 */
function createApp() {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable for development, configure for production
  }));

  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser(config.cookie.secret));

  // Global rate limiter
  app.use(apiRateLimiter);

  // Request logging (development)
  if (config.server.nodeEnv === 'development') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });
  }

  // Health check endpoint
  app.get('/health', asyncHandler(async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: config.server.nodeEnv,
    });
  }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/travel-plans', travelPlansRoutes);
  app.use('/api/search-history', searchHistoryRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      name: 'Weather Travel Planner API',
      version: '1.0.0',
      description: 'REST API for Real-Time Weather and Travel Planner',
      endpoints: {
        auth: '/api/auth',
        weather: '/api/weather',
        favorites: '/api/favorites',
        travelPlans: '/api/travel-plans',
        searchHistory: '/api/search-history',
        dashboard: '/api/dashboard',
      },
      documentation: '/api/docs',
    });
  });

  // 404 handler for unknown routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;