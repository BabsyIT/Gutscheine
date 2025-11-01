/**
 * API-Funktion zum Versenden von Gutschein-E-Mails über GitHub Actions
 *
 * Diese Datei kann in verschiedenen Umgebungen verwendet werden:
 * 1. Als Netlify/Vercel Serverless Function
 * 2. Als Node.js Backend-Service
 * 3. Direkt über GitHub API von der Frontend-Anwendung
 */

// Option 1: Netlify/Vercel Serverless Function
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientEmail, voucherCode, partnerName, description, senderName } = req.body;

    // Validierung
    if (!recipientEmail || !voucherCode || !partnerName || !description) {
      return res.status(400).json({
        error: 'Fehlende erforderliche Felder',
        required: ['recipientEmail', 'voucherCode', 'partnerName', 'description']
      });
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // GitHub API Call zum Auslösen des Workflows
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'BabsyIT/Gutscheine';
    const workflowId = 'send-voucher-email.yml';

    if (!githubToken) {
      return res.status(500).json({
        error: 'Server-Konfigurationsfehler: GITHUB_TOKEN nicht gesetzt'
      });
    }

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            recipient_email: recipientEmail,
            voucher_code: voucherCode,
            partner_name: partnerName,
            description: description,
            sender_name: senderName || 'Babsy Partnergutscheine'
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API Error:', errorData);
      return res.status(500).json({
        error: 'Fehler beim Auslösen des E-Mail-Versands',
        details: errorData
      });
    }

    return res.status(200).json({
      success: true,
      message: 'E-Mail wird versendet...',
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Interner Serverfehler',
      message: error.message
    });
  }
}

// Option 2: Node.js Express Endpoint
export async function sendVoucherEmail(emailData) {
  const { recipientEmail, voucherCode, partnerName, description, senderName } = emailData;

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO || 'BabsyIT/Gutscheine';

  const response = await fetch(
    `https://api.github.com/repos/${githubRepo}/actions/workflows/send-voucher-email.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          recipient_email: recipientEmail,
          voucher_code: voucherCode,
          partner_name: partnerName,
          description: description,
          sender_name: senderName || 'Babsy Partnergutscheine'
        }
      })
    }
  );

  return response;
}

// Option 3: Frontend-Integration (direkte GitHub API Nutzung)
// HINWEIS: Aus Sicherheitsgründen sollte dies über einen Backend-Service erfolgen!
export class VoucherEmailService {
  constructor(githubToken, githubRepo = 'BabsyIT/Gutscheine') {
    this.githubToken = githubToken;
    this.githubRepo = githubRepo;
  }

  async sendEmail({ recipientEmail, voucherCode, partnerName, description, senderName }) {
    const response = await fetch(
      `https://api.github.com/repos/${this.githubRepo}/actions/workflows/send-voucher-email.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${this.githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            recipient_email: recipientEmail,
            voucher_code: voucherCode,
            partner_name: partnerName,
            description: description,
            sender_name: senderName || 'Babsy Partnergutscheine'
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    return { success: true, message: 'E-Mail wird versendet...' };
  }
}
