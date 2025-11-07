const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  [
    body('username').isLength({ min: 3, max: 50 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').isLength({ min: 2, max: 255 }).trim(),
    body('userType').optional().isIn(['member', 'partner', 'employee'])
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
  [
    body('username').notEmpty().trim(),
    body('password').notEmpty()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const result = await authService.login(
        username,
        password,
        req.ip,
        req.headers['user-agent']
      );
      res.json(result);
    } catch (error) {
      error.statusCode = 401;
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      res.json(result);
    } catch (error) {
      error.statusCode = 401;
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout',
  authenticateToken,
  async (req, res, next) => {
    try {
      await authService.logout(req.user.userId, req.body.refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticateToken,
  async (req, res, next) => {
    try {
      const user = await authService.getUserProfile(req.user.userId);
      res.json(user);
    } catch (error) {
      error.statusCode = 404;
      next(error);
    }
  }
);

module.exports = router;
