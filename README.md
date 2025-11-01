# Babsy Partnergutscheine System

Ein vollständiges Gutschein-Verwaltungssystem mit Partnerkarte, E-Mail-Versand und GitHub Actions Integration.

## Features

- 🗺️ **Interaktive Partner-Karte** - Zeigt alle Partner auf einer Schweizer Karte
- 🎫 **Gutschein-Generierung** - Direkt von der Partnerkarte aus
- 📧 **E-Mail-Versand** - Automatischer Versand via GitHub Actions
- 📊 **Gutschein-Verwaltung** - Übersicht über alle generierten Gutscheine
- 📱 **Responsive Design** - Optimiert für Desktop und Mobile
- 🎨 **Einheitliches Design** - Konsistente Farben und Stile

## Projektstruktur

```
Gutscheine/
├── index.html              # Startseite (noch zu erstellen)
├── karte.html             # Interaktive Partnerkarte mit Leaflet
├── gutscheine.html        # Gutschein-Verwaltungsseite
├── code.html              # Code-Verwaltung
├── countdown.html         # Countdown-Timer
├── styles.css             # Gemeinsame Styles
├── api/
│   └── send-email.js      # E-Mail-Versand API
├── .github/
│   └── workflows/
│       └── send-voucher-email.yml  # GitHub Actions Workflow
└── README.md              # Diese Datei
```

## Setup

### 1. GitHub Repository vorbereiten

1. Repository auf GitHub erstellen (falls noch nicht vorhanden)
2. Code committen und pushen

### 2. GitHub Secrets konfigurieren

Gehe zu: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Füge folgende Secrets hinzu:

```
SMTP_SERVER       = smtp.gmail.com (oder dein SMTP-Server)
SMTP_PORT         = 587
SMTP_USERNAME     = deine-email@example.com
SMTP_PASSWORD     = dein-app-passwort
SMTP_FROM_EMAIL   = noreply@babsy.ch
GITHUB_TOKEN      = (wird automatisch bereitgestellt)
```

#### Gmail SMTP Setup

Falls du Gmail verwendest:

1. Gehe zu [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification aktivieren
3. Security → App passwords → Neue App erstellen
4. Verwende das generierte Passwort für `SMTP_PASSWORD`

### 3. E-Mail-Versand Integration

#### Option A: Serverless (Netlify/Vercel)

1. Deploye das Projekt auf Netlify oder Vercel
2. Füge Environment Variables hinzu:
   ```
   GITHUB_TOKEN=dein_github_token
   GITHUB_REPO=BabsyIT/Gutscheine
   ```

3. Die `api/send-email.js` wird automatisch als Serverless Function erkannt

#### Option B: GitHub Actions (Empfohlen für einfaches Setup)

Der Workflow ist bereits konfiguriert! E-Mails werden automatisch versendet wenn:

1. Ein Benutzer auf "E-Mail senden" klickt
2. Die GitHub API den Workflow auslöst
3. Der Workflow die E-Mail über SMTP versendet

### 4. Frontend-Integration aktivieren

Aktualisiere `gutscheine.html` um die API zu verwenden:

```javascript
// In gutscheine.html, Zeile ~370
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const recipientEmail = document.getElementById('recipientEmail').value;
    const senderName = document.getElementById('senderName').value;

    try {
        // Option 1: Über Serverless Function
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientEmail,
                voucherCode: selectedVoucher.code,
                partnerName: selectedVoucher.partner,
                description: selectedVoucher.description,
                senderName
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ E-Mail erfolgreich versendet!');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Fehler beim Versenden der E-Mail');
    }

    closeEmailModal();
});
```

## Verwendung

### Gutschein erstellen

1. Öffne [karte.html](karte.html)
2. Klicke auf einen Partner-Marker
3. Klicke auf "Gutschein generieren"
4. Der Gutschein wird erstellt und im localStorage gespeichert

### Gutscheine verwalten

1. Öffne [gutscheine.html](gutscheine.html)
2. Siehe alle erstellten Gutscheine
3. Filtere nach Status (Alle/Aktiv/Eingelöst)
4. Versende Gutscheine per E-Mail
5. Lösche nicht mehr benötigte Gutscheine

### Gutschein per E-Mail versenden

1. Klicke auf "E-Mail" bei einem aktiven Gutschein
2. Gebe die E-Mail-Adresse des Empfängers ein
3. Optional: Füge deinen Namen hinzu
4. Klicke auf "Senden"
5. Die E-Mail wird über GitHub Actions versendet

## Farbschema

```css
--primary-color: #a71a80      /* Magenta/Pink */
--secondary-color: #009fad    /* Türkis/Cyan */
--background-color: #f3f4f6   /* Hellgrau */
--card-color: #ffffff         /* Weiß */
--text-color: #1f2937         /* Dunkelgrau */
```

## Browser-Unterstützung

- Chrome/Edge (letzte 2 Versionen)
- Firefox (letzte 2 Versionen)
- Safari (letzte 2 Versionen)
- Mobile Browser (iOS Safari, Chrome Mobile)

## Technologien

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Karte**: Leaflet.js + OpenStreetMap
- **Icons**: Font Awesome 6
- **Backend**: GitHub Actions + SMTP
- **Storage**: LocalStorage (client-side)

## Sicherheitshinweise

⚠️ **Wichtig**:

1. GitHub Token **NIEMALS** im Frontend-Code verwenden
2. Verwende immer einen Backend-Service oder Serverless Functions
3. SMTP-Credentials nur in GitHub Secrets speichern
4. Implementiere Rate-Limiting für E-Mail-Versand
5. Validiere E-Mail-Adressen serverseitig

## Nächste Schritte

- [ ] index.html Startseite erstellen
- [ ] Seiten stilistisch vollständig angleichen
- [ ] Datenbank-Integration (optional, statt localStorage)
- [ ] Admin-Panel für Partner-Verwaltung
- [ ] QR-Code-Generierung für Gutscheine
- [ ] PDF-Export für Gutscheine

## Deployment

### GitHub Pages

1. Gehe zu Repository Settings
2. Pages → Source: `main` branch
3. URL: `https://babsyit.github.io/Gutscheine/`

### Netlify

```bash
# netlify.toml
[build]
  publish = "."

[functions]
  directory = "api"
```

### Vercel

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

## Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Dokumentation prüfen
- SMTP-Logs in GitHub Actions überprüfen

## Lizenz

© 2025 Babsy. Alle Rechte vorbehalten.
