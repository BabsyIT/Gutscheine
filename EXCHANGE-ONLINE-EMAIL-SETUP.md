# Exchange Online / Microsoft 365 Email Setup

Anleitung zur Konfiguration des Babsy Gutschein-Systems mit Exchange Online (Microsoft 365) für den E-Mail-Versand.

## 📧 Übersicht

Das System verwendet **Nodemailer** mit SMTP, um E-Mails über Exchange Online zu versenden. Dies funktioniert mit:
- Microsoft 365 Business
- Microsoft 365 Enterprise
- Exchange Online
- Outlook.com (mit Einschränkungen)

## 🔧 Voraussetzungen

### Option A: Dediziertes Postfach (Empfohlen)

✅ **Empfohlen für Production**

1. Erstellen Sie ein dediziertes Postfach in Microsoft 365:
   - z.B. `noreply@ihredomain.ch`
   - oder `gutscheine@ihredomain.ch`

2. Lizenz zuweisen (Exchange Online Plan 1 oder höher)

3. SMTP Auth aktivieren (siehe unten)

### Option B: Benutzer-Postfach

⚠️ **Nur für Testing/Development**

Verwenden Sie ein bestehendes Benutzer-Postfach.

## 📋 Schritt-für-Schritt Setup

### 1. SMTP Authentication aktivieren

#### Im Microsoft 365 Admin Center:

1. Gehe zu **Exchange Admin Center** (admin.exchange.microsoft.com)
2. **Mailboxes** → Wähle das Postfach
3. **Settings** → **Email** → **SMTP Submission**
4. Aktiviere **"Authenticated SMTP"**

#### Per PowerShell (für Admins):

```powershell
# Verbinden mit Exchange Online
Connect-ExchangeOnline

# SMTP Auth für spezifisches Postfach aktivieren
Set-CASMailbox -Identity "noreply@ihredomain.ch" -SmtpClientAuthenticationDisabled $false

# Prüfen
Get-CASMailbox -Identity "noreply@ihredomain.ch" | Select SmtpClientAuthenticationDisabled
```

### 2. App-Passwort erstellen (wenn MFA aktiviert)

Wenn Multi-Faktor-Authentifizierung (MFA) aktiviert ist:

1. Gehe zu **MyAccount** (account.microsoft.com)
2. **Security** → **Additional security verification**
3. **App passwords**
4. Erstelle neues App-Passwort für "Babsy Voucher System"
5. **Kopiere das Passwort** (wird nur einmal angezeigt!)

### 3. Environment Variables konfigurieren

#### .env Datei bearbeiten:

```bash
cd backend
nano .env
```

**Konfiguration:**

```bash
# Exchange Online SMTP
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@ihredomain.ch
SMTP_PASSWORD=dein-passwort-oder-app-passwort

# Absender-Name
EMAIL_FROM_NAME=Babsy Partnergutscheine

# Frontend URL (für Links in E-Mails)
FRONTEND_URL=https://app.ihredomain.ch
```

#### Wichtig:
- `SMTP_USER`: Die vollständige E-Mail-Adresse
- `SMTP_PASSWORD`: Das normale Passwort ODER App-Passwort (bei MFA)
- `SMTP_HOST`: Immer `smtp.office365.com`
- `SMTP_PORT`: Immer `587` (STARTTLS)

### 4. Docker Container neu starten

```bash
# Self-Hosted Setup
make restart

# Oder manuell
docker-compose -f docker-compose.selfhosted.yml restart backend
```

### 5. E-Mail-Versand testen

#### Im Backend Container:

```bash
# Shell öffnen
docker-compose -f docker-compose.selfhosted.yml exec backend sh

# Node REPL
node

# Test-Code
const emailService = require('./src/services/emailService');
emailService.testConnection()
  .then(() => console.log('✅ Success'))
  .catch(err => console.error('❌ Error:', err));
```

#### Via API:

```bash
# Test-Endpoint (optional hinzufügen):
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

## 📨 Verfügbare E-Mail-Templates

Das System verschickt automatisch E-Mails bei folgenden Events:

### 1. **Gutschein generiert** (`voucher-generated`)
- Wird versendet wenn ein Gutschein erstellt wird
- Enthält: QR-Code Link, Gutschein-Code, Partner-Info
- An: Kunde

### 2. **Gutschein eingelöst** (`voucher-redeemed`)
- Wird versendet wenn ein Gutschein eingelöst wird
- Enthält: Bestätigung, Partner, Zeitpunkt
- An: Kunde

### 3. **Willkommens-E-Mail** (`welcome`)
- Wird bei Registrierung versendet
- Enthält: Erste Schritte, Links zu Features
- An: Neuer Benutzer

### 4. **Passwort zurücksetzen** (`password-reset`)
- Wird bei Passwort-Reset-Anfrage versendet
- Enthält: Reset-Link mit Token
- An: Benutzer

### 5. **Partner-Benachrichtigung** (`partner-notification`)
- Wird versendet wenn ein Gutschein für Partner generiert wird
- Enthält: Gutschein-Details, Kunden-Info
- An: Partner

## 🎨 E-Mail Templates anpassen

Templates befinden sich in: `backend/src/templates/emails/`

```
backend/src/templates/emails/
├── voucher-generated.hbs      # Gutschein generiert
├── voucher-redeemed.hbs       # Gutschein eingelöst
├── welcome.hbs                # Willkommen
├── password-reset.hbs         # Passwort zurücksetzen
└── partner-notification.hbs   # Partner-Benachrichtigung
```

### Template bearbeiten:

```bash
nano backend/src/templates/emails/voucher-generated.hbs
```

Templates verwenden **Handlebars** Syntax:

```html
<p>Hallo {{userName}},</p>
<p>Ihr Gutschein-Code: <strong>{{voucherCode}}</strong></p>

{{#if expiresAt}}
<p>Gültig bis: {{expiresAt}}</p>
{{/if}}
```

### Verfügbare Variablen:

**voucher-generated.hbs:**
- `userName`, `voucherCode`, `partnerName`
- `partnerDescription`, `value`, `discountPercentage`
- `expiresAt`, `qrCodeUrl`, `partnerType`, `partnerHomepage`

**voucher-redeemed.hbs:**
- `userName`, `voucherCode`, `partnerName`, `redeemedAt`

**welcome.hbs:**
- `userName`, `loginUrl`, `mapUrl`

**password-reset.hbs:**
- `userName`, `resetUrl`, `expiresIn`

**partner-notification.hbs:**
- `partnerName`, `voucherCode`, `userName`
- `userEmail`, `description`, `createdAt`

## 🔒 Sicherheit & Best Practices

### 1. Sichere Passwörter

```bash
# App-Passwort verwenden (empfohlen bei MFA)
SMTP_PASSWORD=abcd-efgh-ijkl-mnop

# NIEMALS das Passwort im Code speichern!
# Immer über Environment Variables
```

### 2. Rate Limiting

Exchange Online Limits:
- **10,000 E-Mails pro Tag** (pro Postfach)
- **30 E-Mails pro Minute**

Das System implementiert automatisch Rate Limiting.

### 3. SPF & DKIM konfigurieren

Für bessere Zustellbarkeit:

**SPF Record (DNS):**
```dns
v=spf1 include:spf.protection.outlook.com -all
```

**DKIM:**
- Wird automatisch von Microsoft 365 gehandhabt
- Falls Custom Domain: In Exchange Admin aktivieren

### 4. Monitoring

```bash
# E-Mail Logs prüfen
docker-compose -f docker-compose.selfhosted.yml logs backend | grep "Email"

# Erfolgreiche E-Mails
docker-compose -f docker-compose.selfhosted.yml logs backend | grep "✅ Email sent"

# Fehler
docker-compose -f docker-compose.selfhosted.yml logs backend | grep "❌ Failed to send email"
```

## 🚨 Troubleshooting

### Problem: "Authentication failed"

**Lösung 1: SMTP Auth prüfen**
```powershell
Get-CASMailbox -Identity "your-email@domain.com" | Select SmtpClientAuthenticationDisabled
# Sollte: False sein
```

**Lösung 2: App-Passwort verwenden**
- Erstelle neues App-Passwort (siehe oben)
- Verwende App-Passwort statt normalem Passwort

**Lösung 3: Modern Authentication**
```powershell
# Modern Auth aktivieren (Admin)
Set-OrganizationConfig -OAuth2ClientProfileEnabled $true
```

### Problem: "Connection timeout"

**Firewall prüfen:**
```bash
# Port 587 testen
telnet smtp.office365.com 587

# Oder mit OpenSSL
openssl s_client -connect smtp.office365.com:587 -starttls smtp
```

**Lösung:**
- Port 587 (STARTTLS) muss erreichbar sein
- Firewall-Regel erstellen falls blockiert

### Problem: "Recipient not found"

**E-Mail-Adresse prüfen:**
```javascript
// Im Code validieren
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  // Ungültige E-Mail
}
```

### Problem: E-Mails landen im Spam

**Checkliste:**
- ✅ SPF Record konfiguriert
- ✅ DKIM aktiviert
- ✅ Von-Adresse ist verifizierte Domain
- ✅ Keine Spam-Wörter im Betreff
- ✅ HTML ist valide
- ✅ Text-Version vorhanden

**Domain Reputation prüfen:**
- https://mxtoolbox.com/
- https://www.mail-tester.com/

### Problem: "Daily sending quota exceeded"

**Lösung:**
```bash
# Prüfe aktuelle Quota
Get-MailboxStatistics -Identity "your-email@domain.com" | Select DisplayName, ItemCount, LastLogonTime

# Warte bis Mitternacht UTC
# Oder: Zusätzliches Postfach erstellen
```

## 📊 Monitoring & Statistiken

### E-Mail Logs anzeigen:

```bash
# Alle E-Mail-Logs
make logs-backend | grep -i email

# Nur Fehler
make logs-backend | grep "❌.*email" -i

# Zähle versendete E-Mails (heute)
docker-compose logs backend | grep "✅ Email sent" | grep $(date +%Y-%m-%d) | wc -l
```

### Audit Log in Datenbank:

```sql
-- Alle E-Mail-Versände
SELECT
    al.created_at,
    al.action,
    al.entity_type,
    u.email,
    al.changes->>'template' as template
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.changes->>'emailSent' = 'true'
ORDER BY al.created_at DESC
LIMIT 50;
```

## 🔄 Alternative SMTP-Provider

Falls Exchange Online nicht verfügbar:

### Gmail (Development nur):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=app-password  # Benötigt App-Passwort!
```

### SendGrid:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Amazon SES:
```bash
SMTP_HOST=email-smtp.eu-central-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

## ✅ Checkliste

- [ ] Exchange Online Postfach erstellt
- [ ] SMTP Auth aktiviert
- [ ] App-Passwort erstellt (bei MFA)
- [ ] `.env` konfiguriert
- [ ] Backend neu gestartet
- [ ] Test-E-Mail versendet
- [ ] SPF Record konfiguriert
- [ ] DKIM aktiviert
- [ ] Templates angepasst (optional)
- [ ] Monitoring eingerichtet

## 📞 Support

Bei Problemen:
- **Microsoft 365 Support**: https://admin.microsoft.com/support
- **Exchange Online Docs**: https://docs.microsoft.com/exchange/
- **Nodemailer Docs**: https://nodemailer.com/

## 📚 Weitere Ressourcen

- [Exchange Online SMTP Settings](https://docs.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365)
- [App Passwords erstellen](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944)
- [SPF Records](https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/set-up-spf-in-office-365-to-help-prevent-spoofing)

---

**Viel Erfolg! 📧**
