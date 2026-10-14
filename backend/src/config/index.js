// Configuration module - Centralized configuration management
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the backend environment file regardless of the process working directory.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

/**
 * Application configuration object
 * All configuration values are sourced from environment variables with sensible defaults
 */
const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'weather_travel_planner',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7,
  },

  // Weather API configuration
  weatherApi: {
    apiKey: process.env.WEATHER_API_KEY || '',
    baseUrl: process.env.WEATHER_API_BASE_URL || 'https://api.weatherapi.com/v1',
    timeout: parseInt(process.env.WEATHER_API_TIMEOUT, 10) || 10000,
    // Cache TTL in seconds (5 minutes default)
    cacheTtl: 300,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
  },

  // Cookie configuration
  cookie: {
    secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Validation: Check for required configuration
  validate() {
    const errors = [];

    if (!this.weatherApi.apiKey || /^(your_|<.*>|replace|changeme)/i.test(this.weatherApi.apiKey)) {
      errors.push('WEATHER_API_KEY must be set to a valid WeatherAPI.com key in backend/.env');
    }

    if (this.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
      errors.push('JWT_SECRET must be changed from default value');
    }

    if (this.cookie.secret === 'your-cookie-secret-change-in-production') {
      errors.push('COOKIE_SECRET must be changed from default value');
    }

    if (errors.length > 0) {
      console.warn('Configuration warnings:');
      errors.forEach(err => console.warn(`  - ${err}`));
    }

    return errors;
  },
};

export default config;