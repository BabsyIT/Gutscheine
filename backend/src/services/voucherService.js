const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const QRCode = require('qrcode');

class VoucherService {
  /**
   * Generate voucher code
   */
  generateVoucherCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    const code = [];

    for (let i = 0; i < segments; i++) {
      let segment = '';
      for (let j = 0; j < segmentLength; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code.push(segment);
    }

    return `BABSY-${code.join('-')}`;
  }

  /**
   * Generate QR code data
   */
  async generateQRCodeData(voucherCode, partnerId) {
    const qrData = JSON.stringify({
      type: 'BABSY_VOUCHER',
      code: voucherCode,
      partnerId,
      timestamp: new Date().toISOString()
    });

    return qrData;
  }

  /**
   * Create voucher
   */
  async generateVoucher({ userId, partnerId, description, value, discountPercentage, expiresAt }) {
    try {
      // Validate partner exists
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId }
      });

      if (!partner || !partner.isActive) {
        throw new Error('Partner not found or inactive');
      }

      // Generate unique code
      let code;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = this.generateVoucherCode();
        const existing = await prisma.voucher.findUnique({ where: { code } });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique voucher code');
      }

      // Generate QR code data
      const qrCodeData = await this.generateQRCodeData(code, partnerId);

      // Create voucher
      const voucher = await prisma.voucher.create({
        data: {
          code,
          partnerId,
          userId,
          title: partner.partnername,
          description: description || partner.descriptionDe,
          value,
          discountPercentage,
          qrCodeData,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        },
        include: {
          partner: true,
          user: true
        }
      });

      // Log audit trail
      await this.logAudit('voucher', voucher.id, 'created', userId, {
        code: voucher.code,
        partnerId
      });

      logger.info(`Voucher generated: ${code} for user ${userId}`);

      return voucher;
    } catch (error) {
      logger.error('Generate voucher error:', error);
      throw error;
    }
  }

  /**
   * Get user's vouchers
   */
  async getUserVouchers(userId, filters = {}) {
    try {
      const where = {
        userId,
        ...filters
      };

      const vouchers = await prisma.voucher.findMany({
        where,
        include: {
          partner: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return vouchers;
    } catch (error) {
      logger.error('Get user vouchers error:', error);
      throw error;
    }
  }

  /**
   * Get single voucher
   */
  async getVoucher(voucherId, userId = null) {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
        include: {
          partner: true,
          user: true,
          redeemedBy: true
        }
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      // If userId provided, check ownership (for members)
      if (userId && voucher.userId !== userId) {
        throw new Error('Unauthorized access to voucher');
      }

      return voucher;
    } catch (error) {
      logger.error('Get voucher error:', error);
      throw error;
    }
  }

  /**
   * Redeem voucher
   */
  async redeemVoucher(voucherId, redeemedByUserId, partnerId) {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
        include: { partner: true }
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      if (voucher.isRedeemed) {
        throw new Error('Voucher already redeemed');
      }

      if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        throw new Error('Voucher has expired');
      }

      if (voucher.partnerId !== partnerId) {
        throw new Error('Voucher is not valid for this partner');
      }

      // Redeem voucher
      const updatedVoucher = await prisma.voucher.update({
        where: { id: voucherId },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
          redeemedById: redeemedByUserId
        },
        include: {
          partner: true,
          user: true,
          redeemedBy: true
        }
      });

      // Log audit trail
      await this.logAudit('voucher', voucherId, 'redeemed', redeemedByUserId, {
        code: voucher.code,
        partnerId
      });

      logger.info(`Voucher redeemed: ${voucher.code} by user ${redeemedByUserId}`);

      return updatedVoucher;
    } catch (error) {
      logger.error('Redeem voucher error:', error);
      throw error;
    }
  }

  /**
   * Validate QR code
   */
  async validateQRCode(qrData, partnerId) {
    try {
      const data = JSON.parse(qrData);

      if (data.type !== 'BABSY_VOUCHER') {
        throw new Error('Invalid QR code type');
      }

      // Find voucher by code
      const voucher = await prisma.voucher.findUnique({
        where: { code: data.code },
        include: { partner: true }
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      if (voucher.isRedeemed) {
        throw new Error('Voucher already redeemed');
      }

      if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        throw new Error('Voucher has expired');
      }

      if (voucher.partnerId !== partnerId) {
        throw new Error('Voucher is not valid for this partner');
      }

      return {
        valid: true,
        voucher
      };
    } catch (error) {
      logger.error('Validate QR code error:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get voucher statistics
   */
  async getStats(partnerId = null) {
    try {
      const where = partnerId ? { partnerId } : {};

      const [total, active, redeemed] = await Promise.all([
        prisma.voucher.count({ where }),
        prisma.voucher.count({ where: { ...where, isRedeemed: false } }),
        prisma.voucher.count({ where: { ...where, isRedeemed: true } })
      ]);

      return {
        total,
        active,
        redeemed,
        redemptionRate: total > 0 ? (redeemed / total * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Get stats error:', error);
      throw error;
    }
  }

  /**
   * Log audit trail
   */
  async logAudit(entityType, entityId, action, userId, changes = null, ipAddress = null, userAgent = null) {
    try {
      await prisma.auditLog.create({
        data: {
          entityType,
          entityId,
          action,
          userId,
          changes,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      logger.error('Audit log error:', error);
      // Don't throw, just log
    }
  }
}

module.exports = new VoucherService();
