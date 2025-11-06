const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
module.exports = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId
  });

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
};
