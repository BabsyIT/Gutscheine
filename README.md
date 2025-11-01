# Babsy Partnergutscheine System

Ein vollständiges Gutschein-Verwaltungssystem mit Partnerkarte, QR-Code-Scanner und hybrider Datenspeicherung.

## 🚀 Live Demo

**Produktiv-System**: https://babsyit.github.io/Gutscheine/

## 📖 Dokumentation

- **[DEMO-GUIDE.md](DEMO-GUIDE.md)** - Schritt-für-Schritt Anleitung für Live-Demos
- **[SETUP.md](SETUP.md)** - Technisches Setup und Architektur

## Features

- 🗺️ **Interaktive Partner-Karte** - Zeigt alle 20 Partner auf einer Schweizer Karte
- 🎫 **Gutschein-Generierung** - Direkt von der Partnerkarte aus
- 📱 **QR-Code Scanner** - Gutscheine im Laden einlösen (Kamera-basiert)
- 🌐 **Online/Offline Partner** - Unterschiedliche Flows für physische Läden vs. Online-Shops
- 📊 **Admin Dashboard** - Babsy Statistiken und Auswertungen
- 💾 **Hybrid Storage** - localStorage + zentrale JSON-Datenbank
- 🔄 **Sync-Tracking** - Zeigt ausstehende Synchronisationen an
- 📥 **Export-Funktion** - Manuelle Synchronisation für Demo
- 📱 **Responsive Design** - Optimiert für Desktop und Mobile
- 🎨 **Einheitliches Design** - Konsistente Farben und Stile

## Projektstruktur

```
Gutscheine/
├── index.html                   # Startseite mit Partner-Übersicht
├── karte.html                   # Interaktive Partnerkarte mit Leaflet
├── gutscheine.html              # Gutschein-Verwaltung (Kunde)
├── admin.html                   # Admin Dashboard (Babsy)
├── partner-qrcodes.html         # QR-Codes für Partner zum Ausdrucken
├── styles.css                   # Gemeinsame Styles
├── data/
│   ├── partners.json            # Partner-Daten mit GPS-Koordinaten
│   └── vouchers.json            # Zentrale Gutschein-Datenbank
├── scripts/
│   ├── generate-voucher.js      # Node.js Script: Gutschein generieren
│   └── redeem-voucher.js        # Node.js Script: Gutschein einlösen
├── .github/
│   └── workflows/
│       └── manage-vouchers.yml  # GitHub Action für Gutschein-Verwaltung
├── DEMO-GUIDE.md                # Demo-Anleitung
├── SETUP.md                     # Technische Dokumentation
└── README.md                    # Diese Datei
```

## Schnellstart

### Für die Demo:

1. Öffne: https://babsyit.github.io/Gutscheine/gutscheine.html
2. Klicke: **"Demo-Daten laden"**
3. Teste: QR-Code Scanner oder Online-Partner Flow
4. Siehe: [DEMO-GUIDE.md](DEMO-GUIDE.md) für detaillierte Szenarien

### Für Entwickler:

Siehe [SETUP.md](SETUP.md) für vollständige Setup-Anleitung.

## Verwendung

### Als Kunde: Gutschein einlösen

**Physischer Laden** (z.B. E-TriColor):
1. Öffne [gutscheine.html](https://babsyit.github.io/Gutscheine/gutscheine.html)
2. Wähle einen aktiven Gutschein
3. Klicke **"QR scannen"**
4. Scanne den QR-Code im Laden
5. Gutschein wird validiert und eingelöst

**Online-Partner** (z.B. KidisArt):
1. Öffne [gutscheine.html](https://babsyit.github.io/Gutscheine/gutscheine.html)
2. Wähle einen Online-Gutschein
3. Klicke **"Code zeigen"**
4. Nutze den Code auf der Partner-Website

### Als Partner: QR-Code generieren

1. Öffne [partner-qrcodes.html](https://babsyit.github.io/Gutscheine/partner-qrcodes.html)
2. Suche deinen Partner-Namen
3. Drucke den QR-Code aus
4. Hänge ihn an der Kasse auf

### Als Babsy: Statistiken ansehen

1. Öffne [admin.html](https://babsyit.github.io/Gutscheine/admin.html)
2. Siehe Gesamt-Statistiken
3. Filtere nach Partner
4. Exportiere Reports

## Technische Details

### Hybrid Storage System

Das System verwendet zwei Datenschichten:

**1. Zentrale Datenbank** (`data/vouchers.json`):
- Git-versioniert
- Für alle Benutzer sichtbar
- Babsy Admin-Dashboard liest hieraus
- Wird via GitHub Actions oder manuell aktualisiert

**2. Lokaler Speicher** (Browser localStorage):
- Benutzerspezifisch
- Offline-fähig
- Sofortige Updates
- Wird mit zentraler DB synchronisiert

**Merge-Strategie**:
```javascript
// Beim Laden:
zentrale_gutscheine = fetch('data/vouchers.json')
lokale_gutscheine = localStorage.getItem('babsy_vouchers')
alle_gutscheine = [...zentrale, ...nur_lokale]

// Beim Speichern:
localStorage.setItem('babsy_vouchers', gutscheine)
markiere_als_pending_sync()
export_funktion_für_manuellen_sync()
```

### QR-Code Validierung

```javascript
// Partner QR-Code Format:
{
  "type": "BABSY_PARTNER",
  "partner": "E-TriColor",
  "category": "Print & Druck"
}

// Beim Scannen:
if (qr_code.partner === gutschein.partner) {
  einlösen() // ✅
} else {
  fehler("Falscher Partner!") // ❌
}
```

## Setup (für Entwickler)

### 1. Repository klonen

```bash
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine
```

### 2. GitHub Actions konfigurieren (optional)

Für automatische Gutschein-Verwaltung via GitHub Actions:

1. Gehe zu: `Settings` → `Actions` → `General`
2. Aktiviere: `Read and write permissions`
3. Die Workflow-Datei muss manuell via GitHub Web UI hinzugefügt werden
4. Siehe [SETUP.md](SETUP.md) für Details

### 3. Lokal testen

```bash
# Öffne einfach die HTML-Dateien im Browser
open index.html
# oder
python -m http.server 8000
# dann: http://localhost:8000
```

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
- **Karte**: Leaflet.js 1.9.4 + OpenStreetMap
- **QR-Codes**: qrcode.js 1.5.3 (Generierung) + html5-qrcode 2.3.8 (Scanner)
- **Icons**: Font Awesome 6.4.0
- **Backend**: GitHub Actions + Node.js Scripts
- **Storage**: Hybrid (localStorage + JSON-Datenbank)
- **Hosting**: GitHub Pages

## Roadmap / Nächste Schritte

**Für die Demo** (Aktuell fertig):
- ✅ index.html Startseite
- ✅ Seiten stilistisch angleichen
- ✅ QR-Code-Generierung und -Scanner
- ✅ Admin-Dashboard (Babsy)
- ✅ Partner QR-Codes zum Ausdrucken
- ✅ Hybrid Storage System

**Für die Produktion** (Siehe [DEMO-GUIDE.md](DEMO-GUIDE.md)):
- [ ] Backend API (Node.js/Express)
- [ ] Echte Datenbank (PostgreSQL/MongoDB)
- [ ] Authentifizierung (OAuth/JWT)
- [ ] Partner Portal (Separate Admin-UI)
- [ ] E-Mail Service (SendGrid/AWS SES)
- [ ] Mobile App (React Native)
- [ ] PDF-Export für Gutscheine
- [ ] Analytics/Tracking

## Deployment

### GitHub Pages (Aktuell)

**Live URL**: https://babsyit.github.io/Gutscheine/

Das System ist bereits deployed und funktioniert komplett ohne Backend-Server!

**Setup**:
1. Repository Settings → Pages
2. Source: `main` branch
3. Automatisches Deployment bei jedem Push

### Alternative Hosting-Optionen

**Netlify** oder **Vercel** funktionieren ebenfalls:
```bash
# Einfach das Repository verbinden
# Keine Build-Konfiguration nötig (statische Seite)
```

## Support & Feedback

Bei Fragen oder Problemen:
- 📖 [DEMO-GUIDE.md](DEMO-GUIDE.md) - Vollständige Demo-Anleitung
- 🛠️ [SETUP.md](SETUP.md) - Technische Dokumentation
- 🐛 [GitHub Issues](https://github.com/BabsyIT/Gutscheine/issues) - Bug Reports
- 📊 [GitHub Actions](https://github.com/BabsyIT/Gutscheine/actions) - Workflow Status

## Lizenz

© 2025 Babsy. Alle Rechte vorbehalten.
