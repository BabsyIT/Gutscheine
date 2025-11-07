const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash,
          userType: userData.userType || 'member',
          name: userData.name
        }
      });

      logger.info(`User registered: ${user.username} (${user.userType})`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Save refresh token
      await this.saveRefreshToken(user.id, tokens.refreshToken, null, null);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(username, password, ipAddress, userAgent) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
        include: { partner: true }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      logger.info(`User logged in: ${user.username}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Save session
      await this.saveSession(user.id, tokens.refreshToken, ipAddress, userAgent);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // Check if session exists
      const tokenHash = await bcrypt.hash(refreshToken, 10);
      const session = await prisma.session.findFirst({
        where: {
          userId: decoded.userId,
          expiresAt: { gte: new Date() }
        }
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { partner: true }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId, refreshToken) {
    try {
      // Delete all sessions for user (or specific session if token provided)
      if (refreshToken) {
        // Delete specific session
        await prisma.session.deleteMany({
          where: { userId }
        });
      } else {
        // Delete all sessions
        await prisma.session.deleteMany({
          where: { userId }
        });
      }

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          partner: true,
          vouchers: {
            include: {
              partner: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        userType: user.userType,
        partnerId: user.partner?.id
      },
      JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_DURATION || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      {
        expiresIn: `${process.env.SESSION_DURATION_DAYS || 7}d`
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Save session (refresh token)
   */
  async saveSession(userId, refreshToken, ipAddress, userAgent) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const durationDays = parseInt(process.env.SESSION_DURATION_DAYS || '7');

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent
      }
    });
  }

  /**
   * Save refresh token (alias for backwards compatibility)
   */
  async saveRefreshToken(userId, refreshToken, ipAddress, userAgent) {
    return this.saveSession(userId, refreshToken, ipAddress, userAgent);
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    if (!user) return null;

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
