# Babsy Gutschein-System Setup

Dieses System verwendet einen **hybriden Ansatz** mit **localStorage + JSON-Datenbank** - perfekt für eine Demo ohne komplexes Backend!

## 🎯 Wie es funktioniert

### Hybrid Storage System:

**Zwei Datenschichten**:
1. **Zentrale Datenbank**: `data/vouchers.json` (Git-versioniert, für alle sichtbar)
2. **Lokaler Speicher**: Browser localStorage (Offline-Fähigkeit, benutzerspezifisch)

### Datenfluss:

**Beim Laden**:
1. Lade Gutscheine aus `data/vouchers.json` (zentral)
2. Lade Gutscheine aus localStorage (lokal)
3. Merge: Alle zentralen + nur-lokale Gutscheine
4. Zeige kombinierten Zustand an

**Beim Speichern**:
1. Speichere sofort in localStorage (offline-fähig)
2. Markiere als "Pending Sync"
3. Export-Funktion für manuelle Synchronisation
4. Optional: GitHub Action für automatische Sync

**Beim Einlösen (QR-Code)**:
1. Kunde scannt Partner-QR-Code im Laden
2. System validiert: Partner muss übereinstimmen
3. Gutschein wird als eingelöst markiert
4. Speicherung in beiden Schichten
5. Babsy sieht Update im Admin-Dashboard

### Vorteile:
- ✅ Keine Backend-Datenbank nötig
- ✅ Funktioniert offline (localStorage)
- ✅ Zentrale Auswertung möglich (data/vouchers.json)
- ✅ Alles versioniert (Git-History)
- ✅ Kostenlos (GitHub Actions Free Tier)
- ✅ Nachvollziehbar (jede Änderung = Git Commit)
- ✅ Demo-tauglich mit echten Funktionen

## 📁 Dateistruktur

```
Gutscheine/
├── data/
│   └── vouchers.json          # Zentrale Gutschein-Datenbank
├── scripts/
│   ├── generate-voucher.js     # Gutschein generieren
│   └── redeem-voucher.js       # Gutschein einlösen
├── .github/workflows/
│   └── manage-vouchers.yml     # GitHub Action
├── admin.html                  # Admin Dashboard
├── gutscheine.html             # Kunden-Ansicht
└── partner-qrcodes.html        # Partner QR-Codes
```

## 🚀 Setup

### 1. Repository Settings

Aktiviere **Actions** im Repository:
1. Gehe zu: `Settings` → `Actions` → `General`
2. Stelle sicher: `Allow all actions and reusable workflows` ist aktiviert
3. Unter `Workflow permissions`: Wähle `Read and write permissions`

### 2. Manueller Workflow-Trigger (für Demo)

#### Gutschein generieren:
1. Gehe zu: `Actions` → `Manage Vouchers`
2. Klicke: `Run workflow`
3. Wähle: `action: generate`
4. Eingeben:
   - `partner_name`: z.B. "E-TriColor"
   - `customer_id`: z.B. "kunde@email.com"
   - `description`: z.B. "10% Rabatt auf alle Produkte"
5. Klicke: `Run workflow`

#### Gutschein einlösen:
1. Gehe zu: `Actions` → `Manage Vouchers`
2. Klicke: `Run workflow`
3. Wähle: `action: redeem`
4. Eingeben:
   - `voucher_id`: Der Gutschein-Code (z.B. "BABSY-A1B2-C3D4-E5F6")
   - `customer_id`: Wer hat eingelöst
5. Klicke: `Run workflow`

### 3. Admin Dashboard aufrufen

```
https://babsyit.github.io/Gutscheine/admin.html
```

Hier siehst du:
- 📊 Statistiken (Gesamt, Aktiv, Eingelöst)
- 🏪 Partner-Auswertung
- 📋 Alle Gutscheine mit Status

## 🎯 Demo-Flow

### Szenario 1: Physischer Partner (E-TriColor)

1. **Kunde kommt auf Webseite**
   - Geht zu `karte.html`
   - Klickt auf E-TriColor
   - Klickt "Gutschein generieren"
   → GitHub Action wird getriggert
   → Gutschein in `vouchers.json` gespeichert

2. **Kunde geht in den Laden**
   - Öffnet `gutscheine.html`
   - Klickt "QR scannen"
   - Scannt Partner-QR-Code im Laden
   → GitHub Action wird getriggert
   → Gutschein als eingelöst markiert

3. **Babsy prüft Statistiken**
   - Öffnet `admin.html`
   - Sieht: 1 Gutschein bei E-TriColor eingelöst

### Szenario 2: Online-Partner (KidisArt)

1. **Kunde generiert Gutschein** (wie oben)
2. **Kunde nutzt Code online**
   - Klickt "Code zeigen"
   - Gibt Code auf www.kidis-art.ch ein
   - Partner bestätigt Einlösung
   → GitHub Action wird manuell getriggert
3. **Babsy sieht Statistik** im Dashboard

## 📊 Datenstruktur (`vouchers.json`)

```json
{
  "vouchers": [
    {
      "id": "voucher-1704067200000",
      "code": "BABSY-A1B2-C3D4-E5F6",
      "partner": "E-TriColor",
      "customerId": "kunde@email.com",
      "description": "10% Rabatt auf alle Produkte",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "isRedeemed": false,
      "redeemedAt": null,
      "redeemedBy": null
    }
  ],
  "stats": {
    "total": 1,
    "active": 1,
    "redeemed": 0
  },
  "lastUpdated": "2025-01-01T00:00:00.000Z"
}
```

## 🔒 Sicherheit

### Aktuell (Demo):
- ⚠️ Keine Authentifizierung
- ⚠️ Jeder kann Actions triggern (wenn Repo öffentlich)
- ✅ Aber: Alles ist nachvollziehbar (Git-History)

### Für Produktion:
- GitHub Repository auf `private` stellen
- Personal Access Token für API-Calls
- Webhook-Secret für Validierung
- Rate-Limiting

## 🎨 Anpassungen

### Andere Partner hinzufügen:
1. Bearbeite `partners.json`
2. Generiere neuen QR-Code auf `partner-qrcodes.html`

### Custom Gutschein-Codes:
Bearbeite Funktion in `scripts/generate-voucher.js`:
```javascript
function generateVoucherCode() {
    // Dein eigenes Format
    return 'BABSY-' + Date.now();
}
```

## 📱 URLs

- **Startseite:** https://babsyit.github.io/Gutscheine/index.html
- **Partner-Karte:** https://babsyit.github.io/Gutscheine/karte.html
- **Meine Gutscheine:** https://babsyit.github.io/Gutscheine/gutscheine.html
- **Admin Dashboard:** https://babsyit.github.io/Gutscheine/admin.html
- **Partner QR-Codes:** https://babsyit.github.io/Gutscheine/partner-qrcodes.html

## ❓ Troubleshooting

### GitHub Action schlägt fehl
- Prüfe: Repository Settings → Actions → Permissions
- Stelle sicher: `Read and write permissions` ist aktiviert

### Gutscheine werden nicht angezeigt
- Hard-Refresh: `Ctrl+F5` (Windows) oder `Cmd+Shift+R` (Mac)
- Prüfe: `data/vouchers.json` existiert

### JSON-Datei ist korrupt
- Setze zurück auf:
```json
{"vouchers":[],"lastUpdated":"2025-01-01T00:00:00.000Z","stats":{"total":0,"active":0,"redeemed":0}}
```

## 🚀 Next Steps für Produktion

1. **Backend-API** statt GitHub Actions
2. **Datenbank** (PostgreSQL, MongoDB)
3. **User-Login** mit JWT
4. **Partner-Dashboard** für Partner-spezifische Statistiken
5. **Mobile App** (React Native)
6. **Push-Benachrichtigungen**
7. **Analytics** (Google Analytics, Mixpanel)

---

Erstellt mit ❤️ für Babsy
