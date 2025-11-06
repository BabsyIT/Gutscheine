const app = require('./app');
const logger = require('./utils/logger');
const { prisma } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Babsy Voucher API server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});
