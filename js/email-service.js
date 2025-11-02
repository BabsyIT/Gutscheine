/**
 * Babsy Email Service
 * Handles email sending via Mailcow SMTP
 */

class EmailService {
    constructor() {
        this.config = null;
        this.isDemoMode = true; // Start in demo mode until config loaded
    }

    /**
     * Load email configuration
     */
    async loadConfig() {
        try {
            const response = await fetch('data/email-config.json');
            this.config = await response.json();
            this.isDemoMode = this.config.demo?.enabled && this.config.demo?.logOnly;
            console.log('📧 Email service initialized', this.isDemoMode ? '(Demo Mode)' : '(Live Mode)');
            return true;
        } catch (error) {
            console.error('Failed to load email config:', error);
            this.isDemoMode = true;
            return false;
        }
    }

    /**
     * Send email via Mailcow SMTP
     * In demo mode: only logs to console
     * In production: would use actual SMTP
     */
    async sendEmail(to, subject, htmlContent, textContent = null) {
        if (!this.config) {
            await this.loadConfig();
        }

        const emailData = {
            from: {
                name: this.config.mailcow.from.name,
                email: this.config.mailcow.from.email
            },
            to: to,
            subject: subject,
            html: htmlContent,
            text: textContent || this.htmlToText(htmlContent),
            timestamp: new Date().toISOString()
        };

        if (this.isDemoMode) {
            console.log('📧 [DEMO] Email would be sent:');
            console.log('   From:', emailData.from.name, `<${emailData.from.email}>`);
            console.log('   To:', emailData.to);
            console.log('   Subject:', emailData.subject);
            console.log('   HTML:', htmlContent);
            return { success: true, demo: true, data: emailData };
        }

        // In production, this would use a backend API that connects to Mailcow SMTP
        // For GitHub Pages (static site), we need a serverless function or backend
        console.warn('⚠️ Live email sending requires a backend API');
        console.log('Email data prepared:', emailData);

        return {
            success: false,
            error: 'Backend API required for live email sending',
            data: emailData
        };
    }

    /**
     * Send voucher generated email
     */
    async sendVoucherGeneratedEmail(userEmail, voucher, partnerInfo) {
        const subject = this.config.mailcow.templates.voucherGenerated.subject
            .replace('{{partnerName}}', voucher.partner);

        const html = this.getVoucherGeneratedTemplate(voucher, partnerInfo);

        return await this.sendEmail(userEmail, subject, html);
    }

    /**
     * Send voucher redeemed email
     */
    async sendVoucherRedeemedEmail(userEmail, voucher, partnerInfo) {
        const subject = this.config.mailcow.templates.voucherRedeemed.subject
            .replace('{{partnerName}}', voucher.partner);

        const html = this.getVoucherRedeemedTemplate(voucher, partnerInfo);

        return await this.sendEmail(userEmail, subject, html);
    }

    /**
     * Send partner notification email
     */
    async sendPartnerNotificationEmail(partnerEmail, voucher) {
        if (!this.config.mailcow.templates.partnerNotification.enabled) {
            console.log('Partner notifications disabled in config');
            return { success: false, disabled: true };
        }

        const subject = this.config.mailcow.templates.partnerNotification.subject;
        const html = this.getPartnerNotificationTemplate(voucher);

        return await this.sendEmail(partnerEmail, subject, html);
    }

    /**
     * HTML Template: Voucher Generated
     */
    getVoucherGeneratedTemplate(voucher, partnerInfo) {
        return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #a71a80, #009fad); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px 20px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
        .voucher-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .voucher-code { background: #a71a80; color: white; font-size: 24px; font-weight: bold; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 2px; margin: 15px 0; }
        .partner-info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #009fad; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 10px 0; }
        .icon { font-size: 48px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">🎁</div>
        <h1>Ihr Babsy Gutschein</h1>
        <p>Viel Spaß beim Einlösen!</p>
    </div>

    <div class="content">
        <p>Hallo!</p>

        <p>Ihr Gutschein wurde erfolgreich generiert. Hier sind die Details:</p>

        <div class="voucher-card">
            <h2 style="color: #a71a80; margin-top: 0;">🏪 ${voucher.partner}</h2>
            <p><strong>Beschreibung:</strong> ${voucher.description || voucher.value}</p>

            <div class="voucher-code">${voucher.code}</div>

            <p style="text-align: center; color: #666; font-size: 14px;">
                Erstellt am: ${new Date(voucher.createdAt).toLocaleDateString('de-CH', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
        </div>

        ${partnerInfo ? `
        <div class="partner-info">
            <h3 style="margin-top: 0; color: #009fad;">📍 Partner-Information</h3>
            <p><strong>Adresse:</strong> ${partnerInfo.adresse || 'Nicht verfügbar'}</p>
            ${partnerInfo.homepage ? `<p><strong>Website:</strong> <a href="${partnerInfo.homepage}">${partnerInfo.homepage}</a></p>` : ''}
            ${partnerInfo.category ? `<p><strong>Kategorie:</strong> ${partnerInfo.category}</p>` : ''}
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://babsyit.github.io/Gutscheine/gutscheine.html" class="btn">
                Meine Gutscheine anzeigen
            </a>
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            <strong>💡 Tipp:</strong> Zeigen Sie diesen Code beim Partner vor oder scannen Sie den QR-Code im Laden.
        </p>
    </div>

    <div class="footer">
        <p>© ${new Date().getFullYear()} Babsy - Ihre digitale Gutscheinverwaltung</p>
        <p>Bei Fragen: <a href="mailto:support@babsy.ch" style="color: #009fad;">support@babsy.ch</a></p>
    </div>
</body>
</html>
        `;
    }

    /**
     * HTML Template: Voucher Redeemed
     */
    getVoucherRedeemedTemplate(voucher, partnerInfo) {
        return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px 20px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
        .success-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #10b981; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">✅</div>
        <h1>Gutschein eingelöst!</h1>
        <p>Vielen Dank für Ihre Nutzung</p>
    </div>

    <div class="content">
        <p>Hallo!</p>

        <p>Ihr Gutschein wurde erfolgreich eingelöst:</p>

        <div class="success-card">
            <h2 style="color: #10b981; margin-top: 0;">🏪 ${voucher.partner}</h2>
            <p><strong>Gutschein-Code:</strong> ${voucher.code}</p>
            <p><strong>Eingelöst am:</strong> ${new Date(voucher.redeemedAt).toLocaleDateString('de-CH', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            Wir hoffen, Sie hatten eine tolle Erfahrung mit ${voucher.partner}!
        </p>

        <p style="text-align: center; margin-top: 20px;">
            <a href="https://babsyit.github.io/Gutscheine/gutscheine.html" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">
                Weitere Gutscheine entdecken
            </a>
        </p>
    </div>

    <div class="footer">
        <p>© ${new Date().getFullYear()} Babsy - Ihre digitale Gutscheinverwaltung</p>
        <p>Bei Fragen: <a href="mailto:support@babsy.ch" style="color: #10b981;">support@babsy.ch</a></p>
    </div>
</body>
</html>
        `;
    }

    /**
     * HTML Template: Partner Notification
     */
    getPartnerNotificationTemplate(voucher) {
        return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #a71a80; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Neuer Gutschein generiert</h1>
    </div>
    <div class="content">
        <p>Ein neuer Gutschein wurde für Ihren Partner generiert:</p>
        <p><strong>Code:</strong> ${voucher.code}</p>
        <p><strong>Kunde:</strong> ${voucher.customerId}</p>
        <p><strong>Erstellt:</strong> ${new Date(voucher.createdAt).toLocaleString('de-CH')}</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Simple HTML to text conversion
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }
}

// Create global instance
window.emailService = new EmailService();
