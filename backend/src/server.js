// Server entry point
import createApp from './app.js';
import config from './config/index.js';
import { testConnection, closePool } from './config/database.js';

// Validate configuration
config.validate();

/**
 * Start the server
 */
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   Weather Travel Planner API Server                          ║
║                                                              ║
║   Environment: ${config.server.nodeEnv.padEnd(44)}║
║   Port: ${config.server.port.toString().padEnd(49)}║
║   Database: Connected                                        ║
║                                                              ║
║   API Base URL: http://localhost:${config.server.port}/api   ║
║   Health Check: http://localhost:${config.server.port}/health║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed.');
        await closePool();
        console.log('Database connections closed.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();