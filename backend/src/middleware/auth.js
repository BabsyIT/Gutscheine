const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authenticate JWT token
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Invalid token attempt: ${err.message}`);
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Require specific user roles
 */
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      logger.warn(`Unauthorized access attempt by ${req.user.username} (${req.user.userType})`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

// Specific role middleware
exports.requireMember = exports.requireRole('member', 'employee');
exports.requirePartner = exports.requireRole('partner', 'employee');
exports.requireEmployee = exports.requireRole('employee');
