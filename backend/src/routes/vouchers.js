const express = require('express');
const router = express.Router();
const voucherService = require('../services/voucherService');
const { authenticateToken, requireMember, requirePartner } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/vouchers
 * Get user's vouchers
 */
router.get('/',
  authenticateToken,
  requireMember,
  [
    query('isRedeemed').optional().isBoolean().toBoolean()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const filters = {};
      if (req.query.isRedeemed !== undefined) {
        filters.isRedeemed = req.query.isRedeemed;
      }

      const vouchers = await voucherService.getUserVouchers(req.user.userId, filters);
      res.json(vouchers);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/vouchers
 * Generate new voucher
 */
router.post('/',
  authenticateToken,
  requireMember,
  [
    body('partnerId').isUUID(),
    body('description').optional().isString().trim(),
    body('value').optional().isDecimal(),
    body('discountPercentage').optional().isInt({ min: 0, max: 100 }),
    body('expiresAt').optional().isISO8601()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const voucher = await voucherService.generateVoucher({
        userId: req.user.userId,
        partnerId: req.body.partnerId,
        description: req.body.description,
        value: req.body.value,
        discountPercentage: req.body.discountPercentage,
        expiresAt: req.body.expiresAt
      });
      res.status(201).json(voucher);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/vouchers/:id
 * Get specific voucher
 */
router.get('/:id',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Members can only see their own vouchers
      // Partners and employees can see any voucher
      const userId = req.user.userType === 'member' ? req.user.userId : null;

      const voucher = await voucherService.getVoucher(req.params.id, userId);
      res.json(voucher);
    } catch (error) {
      error.statusCode = 404;
      next(error);
    }
  }
);

/**
 * POST /api/vouchers/:id/redeem
 * Redeem voucher
 */
router.post('/:id/redeem',
  authenticateToken,
  requirePartner,
  async (req, res, next) => {
    try {
      if (!req.user.partnerId) {
        throw new Error('Partner ID not found in user profile');
      }

      const voucher = await voucherService.redeemVoucher(
        req.params.id,
        req.user.userId,
        req.user.partnerId
      );
      res.json(voucher);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/vouchers/validate
 * Validate QR code
 */
router.post('/validate',
  authenticateToken,
  requirePartner,
  [body('qrData').notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      if (!req.user.partnerId) {
        throw new Error('Partner ID not found in user profile');
      }

      const result = await voucherService.validateQRCode(
        req.body.qrData,
        req.user.partnerId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/vouchers/stats
 * Get voucher statistics
 */
router.get('/stats/overview',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Partners can only see their own stats
      const partnerId = req.user.userType === 'partner' ? req.user.partnerId : null;

      const stats = await voucherService.getStats(partnerId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
