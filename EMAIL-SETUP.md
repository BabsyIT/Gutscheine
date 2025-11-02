# E-Mail Funktionalität mit Mailcow

Diese Anleitung erklärt, wie Sie die E-Mail-Funktionalität mit Ihrem Mailcow-Server einrichten.

## 📧 Funktionen

Das System kann automatisch E-Mails versenden für:

1. **Gutschein generiert** - Sendet dem Kunden den Gutschein-Code per E-Mail
2. **Gutschein eingelöst** - Bestätigung nach erfolgreicher Einlösung
3. **Partner-Benachrichtigung** - (Optional) Informiert Partner über neue Gutscheine

## 🔧 Konfiguration

### 1. Mailcow-Zugangsdaten einrichten

Bearbeiten Sie die Datei `data/email-config.json`:

```json
{
  "mailcow": {
    "smtp": {
      "host": "mail.ihredomain.ch",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "gutscheine@babsy.ch",
        "pass": "IHR_MAILCOW_PASSWORT"
      }
    },
    "from": {
      "name": "Babsy Gutscheine",
      "email": "gutscheine@babsy.ch"
    }
  }
}
```

### 2. Mailcow E-Mail-Konto erstellen

In Ihrer Mailcow-Admin-Oberfläche:

1. Gehe zu **E-Mail** → **Postfächer**
2. Klicke auf **Postfach hinzufügen**
3. Erstelle ein neues Postfach:
   - **E-Mail-Adresse**: `gutscheine@babsy.ch`
   - **Passwort**: Sicheres Passwort generieren
   - **Quota**: 1024 MB (sollte reichen)
4. Speichern

### 3. SMTP-Einstellungen in Mailcow

Typische Mailcow SMTP-Einstellungen:

- **Host**: `mail.ihredomain.ch` (Ihre Mailcow-Domain)
- **Port**: `587` (STARTTLS) oder `465` (SSL/TLS)
- **Secure**: `false` für Port 587, `true` für Port 465
- **Authentifizierung**: Ja (mit Benutzername + Passwort)

### 4. Testen Sie die Verbindung

Sie können die SMTP-Verbindung testen mit:

```bash
telnet mail.ihredomain.ch 587
```

Oder mit einem E-Mail-Client wie Thunderbird die Einstellungen testen.

## 🚀 Integration in die Webseite

### Aktueller Stand: Demo-Modus

Derzeit läuft das System im **Demo-Modus**:
- E-Mails werden nur in der Browser-Konsole geloggt
- Keine echten E-Mails werden versendet
- Perfekt zum Testen und Entwickeln

### Für Produktion: Backend API erforderlich

Da GitHub Pages nur statische Seiten hostet, benötigen Sie für den Live-Versand ein Backend:

#### Option 1: Serverless Function (Empfohlen)

**Mit Vercel/Netlify Functions:**

1. Erstellen Sie eine Serverless Function in `api/send-email.js`:

```javascript
// api/send-email.js
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html } = req.body;

    // Mailcow SMTP Konfiguration
    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: to,
            subject: subject,
            html: html
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
}
```

2. Umgebungsvariablen in Vercel/Netlify setzen:
   - `SMTP_HOST=mail.ihredomain.ch`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=gutscheine@babsy.ch`
   - `SMTP_PASS=IHR_PASSWORT`
   - `SMTP_FROM_NAME=Babsy Gutscheine`
   - `SMTP_FROM_EMAIL=gutscheine@babsy.ch`

3. Aktualisieren Sie `js/email-service.js` um die API aufzurufen:

```javascript
// In sendEmail() Methode:
const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData)
});
```

#### Option 2: Eigener Backend-Server

**Mit Node.js/Express:**

```javascript
// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransporter({
    host: 'mail.ihredomain.ch',
    port: 587,
    secure: false,
    auth: {
        user: 'gutscheine@babsy.ch',
        pass: 'IHR_PASSWORT'
    }
});

app.post('/api/send-email', async (req, res) => {
    try {
        await transporter.sendMail(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);
```

## 📝 Verwendung im Code

### Gutschein generieren mit E-Mail

```javascript
// E-Mail-Service initialisieren
await emailService.loadConfig();

// Gutschein generieren
const voucher = {
    code: 'BABSY-XY12-3456',
    partner: 'E-TriColor',
    description: '10% Rabatt',
    createdAt: new Date().toISOString()
};

// E-Mail an Kunden senden
await emailService.sendVoucherGeneratedEmail(
    'kunde@example.com',
    voucher,
    partnerInfo  // Optional: Partner-Informationen
);
```

### Gutschein eingelöst mit E-Mail

```javascript
// Nach erfolgreicher Einlösung
await emailService.sendVoucherRedeemedEmail(
    'kunde@example.com',
    voucher,
    partnerInfo
);
```

## 🎨 E-Mail Templates

Die E-Mail-Templates sind in `js/email-service.js` definiert und können angepasst werden:

- `getVoucherGeneratedTemplate()` - Gutschein erstellt
- `getVoucherRedeemedTemplate()` - Gutschein eingelöst
- `getPartnerNotificationTemplate()` - Partner-Benachrichtigung

Templates verwenden:
- Responsive HTML/CSS
- Babsy Farben (#a71a80 und #009fad)
- Icons und Call-to-Action Buttons
- Mobile-freundliches Design

## 🔒 Sicherheit

**Wichtig für Produktion:**

1. **Niemals** Passwörter im Frontend-Code speichern
2. Alle SMTP-Credentials als Umgebungsvariablen auf dem Backend
3. API-Endpunkte mit Rate-Limiting schützen
4. E-Mail-Adressen validieren vor dem Versand
5. SPF, DKIM und DMARC in Mailcow konfigurieren

### Mailcow SPF/DKIM einrichten

In Mailcow:
1. Gehe zu **Konfiguration** → **Routing**
2. Aktiviere DKIM für Ihre Domain
3. Kopiere die DNS-Einträge
4. Füge sie in Ihrer DNS-Zone hinzu:
   - SPF: `v=spf1 mx a include:_spf.ihredomain.ch ~all`
   - DKIM: TXT-Eintrag von Mailcow
   - DMARC: `v=DMARC1; p=quarantine; rua=mailto:postmaster@ihredomain.ch`

## 📊 Monitoring

Mailcow bietet integriertes Monitoring:
- Gehe zu **Logs** → **SMTP-Logs**
- Überwache gesendete E-Mails
- Prüfe auf Fehler oder Bounce-Mails

## ❓ Troubleshooting

### E-Mails kommen nicht an

1. **SMTP-Verbindung testen:**
   ```bash
   telnet mail.ihredomain.ch 587
   ```

2. **Mailcow-Logs prüfen:**
   ```bash
   docker-compose logs -f postfix-mailcow
   ```

3. **SPF/DKIM prüfen:**
   - Verwende https://mxtoolbox.com/dkim.aspx
   - Teste SPF: https://mxtoolbox.com/spf.aspx

4. **Port 587 offen?**
   ```bash
   nmap -p 587 mail.ihredomain.ch
   ```

### SMTP-Authentifizierung schlägt fehl

- Passwort korrekt?
- Benutzername ist die vollständige E-Mail-Adresse
- In Mailcow: Ist das Postfach aktiv?

### E-Mails landen im Spam

- SPF, DKIM, DMARC konfiguriert?
- Reverse DNS (PTR) für Server-IP gesetzt?
- IP-Adresse nicht auf Blacklist? Prüfe: https://mxtoolbox.com/blacklists.aspx

## 🎯 Nächste Schritte

1. ✅ Mailcow-Postfach erstellen
2. ✅ SMTP-Credentials in `email-config.json` eintragen
3. ✅ Backend API einrichten (Vercel/Netlify oder eigener Server)
4. ✅ Demo-Modus deaktivieren in `email-config.json`
5. ✅ SPF/DKIM konfigurieren
6. ✅ Test-E-Mails versenden

## 📞 Support

Bei Fragen zu:
- **Mailcow**: https://mailcow.github.io/mailcow-dockerized-docs/
- **Nodemailer**: https://nodemailer.com/
- **Vercel Functions**: https://vercel.com/docs/functions

---

**Viel Erfolg mit Ihrer E-Mail-Integration! 📧**
