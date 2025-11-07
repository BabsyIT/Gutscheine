const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.authMethod = process.env.EMAIL_AUTH_METHOD || 'basic'; // 'basic' or 'oauth2'
    this.initTransporter();
    this.loadTemplates();
  }

  /**
   * Initialize Exchange Online SMTP Transporter
   * Supports both Basic Auth and OAuth 2.0
   */
  initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.office365.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;

    if (!user) {
      logger.warn('⚠️  Email service not configured. Set SMTP_USER.');
      return;
    }

    let config = {
      host,
      port,
      secure: false, // true for 465, false for other ports
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    };

    // Configure authentication based on method
    if (this.authMethod === 'oauth2') {
      config.auth = this.getOAuth2Config();
      if (!config.auth) {
        logger.warn('⚠️  OAuth2 not configured. Falling back to basic auth.');
        this.authMethod = 'basic';
      }
    }

    // Fallback to basic auth
    if (this.authMethod === 'basic') {
      const password = process.env.SMTP_PASSWORD;
      if (!password) {
        logger.warn('⚠️  Email service not configured. Set SMTP_PASSWORD.');
        return;
      }
      config.auth = {
        user,
        pass: password
      };
    }

    try {
      this.transporter = nodemailer.createTransport(config);

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('❌ Email service connection failed:', error.message);
        } else {
          logger.info(`✅ Email service ready (Exchange Online - ${this.authMethod.toUpperCase()})`);
        }
      });
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Get OAuth 2.0 configuration
   */
  getOAuth2Config() {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;
    const user = process.env.SMTP_USER;

    // Check if all OAuth credentials are provided
    if (!clientId || !clientSecret || !tenantId) {
      return null;
    }

    // Use Microsoft Identity Platform for OAuth2
    return {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken: process.env.AZURE_REFRESH_TOKEN,
      accessToken: process.env.AZURE_ACCESS_TOKEN,
      expires: process.env.AZURE_TOKEN_EXPIRES,
      // Use Microsoft Graph token endpoint
      accessUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    };
  }

  /**
   * Get OAuth 2.0 Access Token using Client Credentials Flow
   * This is for app-only authentication (service accounts)
   */
  async getOAuth2AccessToken() {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Azure OAuth2 credentials not configured');
    }

    try {
      const { ClientSecretCredential } = require('@azure/identity');

      const credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
      );

      // Get token for Microsoft Graph (includes email sending permissions)
      const token = await credential.getToken('https://graph.microsoft.com/.default');

      logger.info('✅ OAuth2 access token obtained');
      return token.token;
    } catch (error) {
      logger.error('❌ Failed to get OAuth2 access token:', error);
      throw error;
    }
  }

  /**
   * Load email templates
   */
  loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/emails');

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      logger.warn('Created email templates directory');
      return;
    }

    try {
      const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));

      templateFiles.forEach(file => {
        const templateName = file.replace('.hbs', '');
        const templateContent = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        this.templates[templateName] = handlebars.compile(templateContent);
      });

      logger.info(`📧 Loaded ${templateFiles.length} email templates`);
    } catch (error) {
      logger.error('Error loading email templates:', error);
    }
  }

  /**
   * Send email using template
   */
  async sendEmail(to, subject, templateName, data) {
    if (!this.transporter) {
      logger.error('Email service not available');
      throw new Error('Email service not configured');
    }

    try {
      // Get template
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      // Render template
      const html = template(data);

      // Email options
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Babsy Partnergutscheine',
          address: process.env.SMTP_USER
        },
        to,
        subject,
        html,
        // Plain text fallback
        text: this.htmlToText(html)
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`✅ Email sent to ${to}: ${subject}`, {
        messageId: info.messageId,
        template: templateName
      });

      return info;
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send voucher generated email
   */
  async sendVoucherGeneratedEmail(user, voucher, partner) {
    const subject = `Ihr Gutschein für ${partner.partnername}`;

    const data = {
      userName: user.name,
      voucherCode: voucher.code,
      partnerName: partner.partnername,
      partnerDescription: voucher.description || partner.descriptionDe,
      value: voucher.value,
      discountPercentage: voucher.discountPercentage,
      expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString('de-CH') : null,
      qrCodeUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/gutscheine.html?voucher=${voucher.id}`,
      partnerType: partner.partnerType,
      partnerHomepage: partner.homepage,
      currentYear: new Date().getFullYear()
    };

    return this.sendEmail(user.email, subject, 'voucher-generated', data);
  }

  /**
   * Send voucher redeemed email
   */
  async sendVoucherRedeemedEmail(user, voucher, partner) {
    const subject = `Gutschein bei ${partner.partnername} eingelöst`;

    const data = {
      userName: user.name,
      voucherCode: voucher.code,
      partnerName: partner.partnername,
      redeemedAt: new Date(voucher.redeemedAt).toLocaleString('de-CH'),
      currentYear: new Date().getFullYear()
    };

    return this.sendEmail(user.email, subject, 'voucher-redeemed', data);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const subject = 'Willkommen bei Babsy Partnergutscheinen!';

    const data = {
      userName: user.name,
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/gutscheine.html`,
      mapUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/karte.html`,
      currentYear: new Date().getFullYear()
    };

    return this.sendEmail(user.email, subject, 'welcome', data);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Passwort zurücksetzen - Babsy';

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password.html?token=${resetToken}`;

    const data = {
      userName: user.name,
      resetUrl,
      expiresIn: '1 Stunde',
      currentYear: new Date().getFullYear()
    };

    return this.sendEmail(user.email, subject, 'password-reset', data);
  }

  /**
   * Send partner notification email
   */
  async sendPartnerNotificationEmail(partner, voucher, user) {
    const subject = `Neuer Gutschein generiert - ${voucher.code}`;

    const data = {
      partnerName: partner.partnername,
      voucherCode: voucher.code,
      userName: user.name,
      userEmail: user.email,
      description: voucher.description,
      createdAt: new Date(voucher.createdAt).toLocaleString('de-CH'),
      currentYear: new Date().getFullYear()
    };

    // Get partner contact email
    const partnerUser = await this.getPartnerContactEmail(partner.userId);
    if (partnerUser && partnerUser.email) {
      return this.sendEmail(partnerUser.email, subject, 'partner-notification', data);
    }
  }

  /**
   * Get partner contact email
   */
  async getPartnerContactEmail(userId) {
    const { prisma } = require('../config/database');
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });
    } catch (error) {
      logger.error('Error getting partner contact:', error);
      return null;
    }
  }

  /**
   * Simple HTML to text converter
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      logger.info('✅ Email connection test successful');
      return true;
    } catch (error) {
      logger.error('❌ Email connection test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
