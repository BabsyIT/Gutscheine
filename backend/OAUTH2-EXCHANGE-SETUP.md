# OAuth 2.0 Exchange Online Email Setup

Dieses Dokument beschreibt die Einrichtung von **OAuth 2.0 Authentifizierung** für Exchange Online E-Mails anstelle der Basic Authentication.

## Warum OAuth 2.0?

✅ **Vorteile gegenüber Basic Auth:**
- **Sicherer**: Keine Passwörter in Umgebungsvariablen
- **Empfohlen**: Microsoft deaktiviert Basic Auth sukzessive
- **Granulare Berechtigungen**: Nur Mail.Send Berechtigung erforderlich
- **Audit-fähig**: Bessere Nachvollziehbarkeit in Azure AD Logs
- **Token-basiert**: Automatisches Token-Refresh durch @azure/identity
- **Zertifikate**: Optional mit Zertifikaten statt Client Secrets

## Übersicht der Authentication Flows

Es gibt zwei Hauptmethoden für OAuth 2.0 mit Exchange Online:

### 1. Client Credentials Flow (App-Only) ✅ EMPFOHLEN
- **Verwendung**: Für Backend-Services ohne Benutzerinteraktion
- **Berechtigung**: `Mail.Send` (Application Permission)
- **Vorteil**: Automatisch, keine Benutzeranmeldung erforderlich
- **Nachteil**: Benötigt Admin-Zustimmung

### 2. Authorization Code Flow (Delegated)
- **Verwendung**: Für Apps, die im Namen eines Benutzers agieren
- **Berechtigung**: `Mail.Send` (Delegated Permission)
- **Vorteil**: Granulare Benutzerkontrolle
- **Nachteil**: Erfordert initiale Benutzeranmeldung und Refresh Token Management

**Unsere Implementierung nutzt Client Credentials Flow**, da E-Mails automatisch vom Backend versendet werden.

---

## Schritt 1: Azure App Registration erstellen

### 1.1 Azure Portal öffnen
1. Gehen Sie zu [Azure Portal](https://portal.azure.com)
2. Navigieren Sie zu **Azure Active Directory** (oder **Microsoft Entra ID**)
3. Klicken Sie auf **App registrations** (App-Registrierungen)
4. Klicken Sie auf **+ New registration** (+ Neue Registrierung)

### 1.2 App registrieren
Füllen Sie das Formular aus:
- **Name**: `Babsy Voucher System - Email Service`
- **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
- **Redirect URI**: Leer lassen (nicht benötigt für Client Credentials Flow)

Klicken Sie auf **Register**.

### 1.3 Application (client) ID notieren
Nach der Registrierung sehen Sie die **Overview**-Seite:
- Kopieren Sie die **Application (client) ID** → Dies ist Ihre `AZURE_CLIENT_ID`
- Kopieren Sie die **Directory (tenant) ID** → Dies ist Ihre `AZURE_TENANT_ID`

---

## Schritt 2: Client Secret erstellen

### 2.1 Secret hinzufügen
1. Gehen Sie in Ihrer App-Registrierung zu **Certificates & secrets**
2. Klicken Sie auf **+ New client secret**
3. Geben Sie eine Beschreibung ein: `Email Service Secret`
4. Wählen Sie eine Gültigkeit: **24 months** (empfohlen)
5. Klicken Sie auf **Add**

### 2.2 Secret Value kopieren
⚠️ **WICHTIG**: Kopieren Sie den **Value** (nicht die Secret ID) sofort!
- Der Secret wird nur einmal angezeigt
- Dieser Wert ist Ihre `AZURE_CLIENT_SECRET`

---

## Schritt 3: API Permissions konfigurieren

### 3.1 Microsoft Graph Permissions hinzufügen
1. Gehen Sie zu **API permissions** (API-Berechtigungen)
2. Klicken Sie auf **+ Add a permission**
3. Wählen Sie **Microsoft Graph**
4. Wählen Sie **Application permissions** (nicht Delegated!)

### 3.2 Mail.Send Permission hinzufügen
1. Suchen Sie nach `Mail`
2. Erweitern Sie **Mail**
3. Wählen Sie **Mail.Send** ✅
   - Diese Berechtigung erlaubt der App, E-Mails als jeder Benutzer zu senden
4. Klicken Sie auf **Add permissions**

### 3.3 Admin Consent erteilen
⚠️ **Erfordert Admin-Rechte**:
1. Klicken Sie auf **Grant admin consent for [Ihr Tenant]**
2. Bestätigen Sie mit **Yes**
3. Der Status sollte jetzt **Granted for [Ihr Tenant]** anzeigen

**Ihre API Permissions sollten so aussehen:**
```
Microsoft Graph (1)
  Mail.Send (Application) ✅ Granted for [Tenant]
```

---

## Schritt 4: Exchange Online Mailbox-Berechtigungen

### 4.1 Warum dieser Schritt?
Die `Mail.Send` Berechtigung allein erlaubt es der App, E-Mails zu senden, aber Sie müssen noch konfigurieren, **welche Mailbox** verwendet werden darf.

### 4.2 PowerShell-Konfiguration

#### Option A: Spezifische Mailbox (EMPFOHLEN)
Erlaubt der App nur, von einer bestimmten Mailbox zu senden:

```powershell
# Mit Exchange Online verbinden
Connect-ExchangeOnline

# Application Permission hinzufügen (nur für spezifische Mailbox)
Add-MailboxPermission -Identity "voucher-noreply@babsy.ch" `
  -User "YOUR_APPLICATION_ID" `
  -AccessRights FullAccess `
  -InheritanceType All

# Alternative: ApplicationImpersonation für alle Mailboxen
New-ManagementRoleAssignment -Role "ApplicationImpersonation" `
  -App "YOUR_APPLICATION_ID" `
  -User "voucher-noreply@babsy.ch"
```

Ersetzen Sie:
- `voucher-noreply@babsy.ch` mit Ihrer Absender-E-Mail-Adresse
- `YOUR_APPLICATION_ID` mit Ihrer Application (client) ID aus Schritt 1.3

#### Option B: Alle Mailboxen (nur für große Organisationen)
```powershell
# App kann von allen Mailboxen senden (nur mit Admin-Genehmigung)
New-ManagementRoleAssignment -App "YOUR_APPLICATION_ID" `
  -Role "Mail.Send"
```

### 4.3 Berechtigung verifizieren
```powershell
# Mailbox-Berechtigungen anzeigen
Get-MailboxPermission -Identity "voucher-noreply@babsy.ch" |
  Where-Object {$_.User -like "*YOUR_APPLICATION_ID*"}

# Management Role Assignments anzeigen
Get-ManagementRoleAssignment -RoleAssignee "YOUR_APPLICATION_ID"
```

---

## Schritt 5: Environment Variables konfigurieren

### 5.1 .env Datei erstellen/aktualisieren
Fügen Sie folgende Variablen zu Ihrer `.env` Datei hinzu:

```bash
# Email Configuration - OAuth 2.0 Method
EMAIL_AUTH_METHOD=oauth2

# Exchange Online SMTP
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=voucher-noreply@babsy.ch
EMAIL_FROM_NAME=Babsy Partnergutscheine

# Azure AD OAuth 2.0 (für EMAIL_AUTH_METHOD=oauth2)
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_CLIENT_SECRET=your-secret-value-from-step-2
AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321
```

### 5.2 Werte eintragen
Ersetzen Sie die Platzhalter mit Ihren echten Werten:
- `AZURE_CLIENT_ID`: Application (client) ID aus Schritt 1.3
- `AZURE_CLIENT_SECRET`: Secret Value aus Schritt 2.2
- `AZURE_TENANT_ID`: Directory (tenant) ID aus Schritt 1.3
- `SMTP_USER`: Die E-Mail-Adresse, von der gesendet wird

---

## Schritt 6: Testen der Konfiguration

### 6.1 Backend starten
```bash
cd backend
npm install  # Installiert @azure/identity und @azure/msal-node
npm run dev
```

### 6.2 Test-E-Mail senden
```bash
# Test-Endpunkt (falls vorhanden)
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

### 6.3 Logs überprüfen
Sie sollten sehen:
```
✅ OAuth2 access token obtained
✅ Email service ready (Exchange Online - OAUTH2)
✅ Email sent to your-email@example.com
```

Falls Fehler auftreten:
```
❌ Failed to get OAuth2 access token: invalid_client
❌ Email service connection failed: Authentication failed
```
→ Siehe Troubleshooting unten

---

## Schritt 7: Fallback zu Basic Auth (Optional)

Wenn OAuth nicht funktioniert, fällt das System automatisch auf Basic Auth zurück:

```bash
# .env Datei
EMAIL_AUTH_METHOD=basic  # oder Variable weglassen
SMTP_PASSWORD=your-app-password
```

Der Service erkennt automatisch fehlende OAuth-Konfiguration und wechselt zu Basic Auth.

---

## Erweiterte Konfiguration

### Zertifikat-basierte Authentifizierung (höchste Sicherheit)

Anstelle von Client Secrets können Sie Zertifikate verwenden:

#### 1. Zertifikat erstellen
```bash
# Self-signed Zertifikat für Entwicklung
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Für Produktion: Verwenden Sie ein von einer CA signiertes Zertifikat
```

#### 2. Zertifikat zu Azure App hochladen
1. Gehen Sie zu **Certificates & secrets** → **Certificates**
2. Klicken Sie auf **Upload certificate**
3. Laden Sie `cert.pem` hoch
4. Notieren Sie den **Thumbprint**

#### 3. Code anpassen
```javascript
// In emailService.js
getOAuth2Config() {
  const certPath = process.env.AZURE_CERT_PATH;
  const certThumbprint = process.env.AZURE_CERT_THUMBPRINT;

  if (certPath && certThumbprint) {
    return {
      type: 'OAuth2',
      user,
      clientId,
      // Verwende Zertifikat statt Secret
      certPath,
      certThumbprint,
      accessUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    };
  }
}
```

### Token Caching (Performance-Optimierung)

OAuth-Tokens sind 1 Stunde gültig. @azure/identity cached sie automatisch:

```javascript
// Optional: Manuelles Token-Caching in Redis
const redis = require('redis');
const client = redis.createClient();

async function getCachedToken() {
  const cached = await client.get('oauth_token');
  if (cached) {
    const { token, expires } = JSON.parse(cached);
    if (Date.now() < expires) {
      return token;
    }
  }

  const newToken = await this.getOAuth2AccessToken();
  await client.set('oauth_token', JSON.stringify({
    token: newToken,
    expires: Date.now() + 3600000 // 1 Stunde
  }));

  return newToken;
}
```

---

## Troubleshooting

### Error: "invalid_client"
**Ursache**: Client ID oder Secret falsch
**Lösung**:
- Überprüfen Sie `AZURE_CLIENT_ID` und `AZURE_CLIENT_SECRET`
- Stellen Sie sicher, dass das Secret nicht abgelaufen ist
- Erstellen Sie ein neues Secret in Azure Portal

### Error: "insufficient_privileges"
**Ursache**: API Permissions nicht erteilt oder kein Admin Consent
**Lösung**:
1. Überprüfen Sie in Azure Portal → App → API permissions
2. Stellen Sie sicher, dass `Mail.Send` (Application) vorhanden ist
3. Klicken Sie auf "Grant admin consent"

### Error: "MailboxNotEnabledForRESTAPI"
**Ursache**: Mailbox-Berechtigungen fehlen (Schritt 4)
**Lösung**:
```powershell
Add-MailboxPermission -Identity "voucher-noreply@babsy.ch" `
  -User "YOUR_APPLICATION_ID" `
  -AccessRights FullAccess
```

### Error: "Authentication failed" mit OAuth
**Ursache**: Token-Endpunkt oder Tenant ID falsch
**Lösung**:
- Überprüfen Sie `AZURE_TENANT_ID`
- Testen Sie den Token-Endpunkt manuell:
```bash
curl -X POST "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials"
```

### Error: "SMTP connection timeout"
**Ursache**: Firewall blockiert Port 587
**Lösung**:
- Testen Sie Konnektivität: `telnet smtp.office365.com 587`
- Öffnen Sie Port 587 (STARTTLS) in Ihrer Firewall
- Bei Docker: Stellen Sie sicher, dass Container Internetzugang hat

### Logs zeigen "Falling back to basic auth"
**Ursache**: OAuth-Konfiguration unvollständig
**Lösung**:
- Stellen Sie sicher, dass **alle** OAuth-Variablen gesetzt sind:
  - `EMAIL_AUTH_METHOD=oauth2`
  - `AZURE_CLIENT_ID`
  - `AZURE_CLIENT_SECRET`
  - `AZURE_TENANT_ID`

---

## Sicherheits-Best Practices

### 1. Secret Rotation
- **Client Secrets**: Rotieren Sie alle 6-12 Monate
- Erstellen Sie ein neues Secret, bevor das alte abläuft
- Aktualisieren Sie `.env` und starten Sie den Service neu

### 2. Least Privilege Principle
- Verwenden Sie nur `Mail.Send` (nicht `Mail.ReadWrite` oder andere)
- Beschränken Sie auf spezifische Mailbox (nicht alle Mailboxen)

### 3. Secret Management
```bash
# ❌ NICHT committen
.env

# ✅ Verwenden Sie Secret Manager
# Azure Key Vault
az keyvault secret set --vault-name babsy-vault \
  --name azure-client-secret \
  --value "your-secret"

# Docker Secrets
echo "your-secret" | docker secret create azure_client_secret -
```

### 4. Audit Logging
Aktivieren Sie Azure AD Audit Logs:
1. Azure Portal → Azure AD → Monitoring → Audit logs
2. Filter: Service = "Microsoft Graph"
3. Überwachen Sie verdächtige Mail.Send Aktivitäten

### 5. IP-Einschränkungen (Optional)
```powershell
# Nur von bestimmten IPs erlauben (Exchange Online)
Set-TransportRule -Identity "Restrict Relay" `
  -SenderIpRanges @{Add="YOUR_SERVER_IP"}
```

---

## Vergleich: Basic Auth vs OAuth 2.0

| Aspekt | Basic Auth | OAuth 2.0 |
|--------|------------|-----------|
| **Sicherheit** | ⚠️ Passwort in .env | ✅ Token-basiert |
| **Empfohlen von Microsoft** | ❌ Deprecated | ✅ Ja |
| **Setup-Komplexität** | ✅ Einfach (2 Min) | ⚠️ Mittel (15 Min) |
| **Admin-Rechte erforderlich** | ❌ Nein | ✅ Ja |
| **Granulare Berechtigungen** | ❌ Nein | ✅ Ja |
| **Audit-Logs** | ⚠️ Begrenzt | ✅ Detailliert |
| **Zukunftssicherheit** | ❌ Wird deaktiviert | ✅ Langfristig |

---

## Migration von Basic Auth zu OAuth

### Schritt-für-Schritt-Migration

1. **OAuth parallel einrichten**:
   ```bash
   # .env - beide Methoden konfiguriert
   EMAIL_AUTH_METHOD=basic  # Noch auf basic
   SMTP_PASSWORD=current-password

   # OAuth-Variablen hinzufügen
   AZURE_CLIENT_ID=...
   AZURE_CLIENT_SECRET=...
   AZURE_TENANT_ID=...
   ```

2. **Testen Sie OAuth**:
   ```bash
   EMAIL_AUTH_METHOD=oauth2 npm run dev
   # Senden Sie Test-E-Mails
   ```

3. **Umschalten**:
   ```bash
   # .env - dauerhaft auf OAuth
   EMAIL_AUTH_METHOD=oauth2
   # SMTP_PASSWORD kann entfernt werden
   ```

4. **Basic Auth deaktivieren** (optional):
   ```bash
   # Azure Portal → Exchange Online → Authentication Policies
   # Deaktivieren Sie Basic Auth für SMTP
   ```

---

## Ressourcen

- [Microsoft Identity Platform Dokumentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph Mail API](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [@azure/identity NPM Package](https://www.npmjs.com/package/@azure/identity)
- [Exchange Online PowerShell](https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell)
- [Nodemailer OAuth2 Guide](https://nodemailer.com/smtp/oauth2/)

---

## Zusammenfassung

**Was Sie jetzt haben:**
✅ Sichere OAuth 2.0 Authentifizierung
✅ Automatisches Token-Management
✅ Granulare Berechtigungen (nur Mail.Send)
✅ Audit-fähige E-Mail-Versendung
✅ Zukunftssichere Lösung (Microsoft-Empfehlung)
✅ Fallback zu Basic Auth bei Bedarf

**Nächste Schritte:**
1. Azure App Registration erstellen (15 Min)
2. OAuth-Credentials in .env eintragen
3. Backend neu starten
4. Test-E-Mail senden
5. Basic Auth deaktivieren (optional)

Bei Fragen oder Problemen: Siehe Troubleshooting-Sektion oben! 🚀
