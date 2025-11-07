const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { authenticateToken, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/partners
 * Get all partners (public)
 */
router.get('/', async (req, res, next) => {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        partnername: 'asc'
      }
    });

    res.json(partners);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/partners/:id
 * Get partner details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: req.params.id }
    });

    if (!partner) {
      const error = new Error('Partner not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(partner);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/partners/:id
 * Update partner (admin only)
 */
router.put('/:id',
  authenticateToken,
  requireEmployee,
  async (req, res, next) => {
    try {
      const partner = await prisma.partner.update({
        where: { id: req.params.id },
        data: req.body
      });

      res.json(partner);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/partners/:id/stats
 * Get partner statistics (admin only)
 */
router.get('/:id/stats',
  authenticateToken,
  requireEmployee,
  async (req, res, next) => {
    try {
      const [total, active, redeemed] = await Promise.all([
        prisma.voucher.count({
          where: { partnerId: req.params.id }
        }),
        prisma.voucher.count({
          where: { partnerId: req.params.id, isRedeemed: false }
        }),
        prisma.voucher.count({
          where: { partnerId: req.params.id, isRedeemed: true }
        })
      ]);

      res.json({
        total,
        active,
        redeemed,
        redemptionRate: total > 0 ? (redeemed / total * 100).toFixed(2) : 0
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
