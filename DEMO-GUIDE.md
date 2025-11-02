# Babsy Gutscheine - Demo Guide

## Übersicht

Das Babsy Gutschein-System funktioniert nun wie ein echtes produktives System mit einem **hybriden Speicher-Ansatz**:

- **Zentrale Datenbank**: `data/vouchers.json` (Git-versioniert)
- **Lokaler Speicher**: Browser localStorage (Offline-Fähigkeit)
- **Automatische Synchronisation**: Merge von zentralen + lokalen Gutscheinen

## Live Demo URL

**Produktiv-System**: https://babsyit.github.io/Gutscheine/

### Verfügbare Seiten:
- [🏠 Startseite](https://babsyit.github.io/Gutscheine/index.html) - Partner-Übersicht
- [🎫 Gutscheine](https://babsyit.github.io/Gutscheine/gutscheine.html) - Kundenansicht
- [🗺️ Partner-Karte](https://babsyit.github.io/Gutscheine/karte.html) - Interaktive Karte
- [🖨️ Partner QR-Codes](https://babsyit.github.io/Gutscheine/partner-qrcodes.html) - Zum Ausdrucken
- [📊 Admin Dashboard](https://babsyit.github.io/Gutscheine/admin.html) - Babsy Statistiken

## Demo-Ablauf

### 1. Login / Authentifizierung

Alle geschützten Seiten erfordern jetzt eine Anmeldung:

#### Gutscheine-Seite (gutscheine.html)
**3 Benutzertypen verfügbar**:

**👤 Mitglied** (Standard):
- Benutzername: `demo` / Passwort: `demo123`
- Benutzername: `mitglied1` / Passwort: `mitglied123`

**🏪 Partner**:
- Benutzername: `demo` / Passwort: `demo123`
- Benutzername: `etricolor` / Passwort: `partner123`
- Benutzername: `kidisart` / Passwort: `partner123`

**👔 Mitarbeiter**:
- Benutzername: `admin` / Passwort: `babsy2025`
- Benutzername: `mitarbeiter` / Passwort: `babsy123`

#### Admin Dashboard (admin.html)
**Nur für Mitarbeiter**:
- Benutzername: `admin` / Passwort: `babsy2025`
- Benutzername: `mitarbeiter` / Passwort: `babsy123`

#### Partner QR-Codes (partner-qrcodes.html)
**Nur für Partner**:
- Benutzername: `demo` / Passwort: `demo123`
- Benutzername: `etricolor` / Passwort: `partner123`

**Session-Dauer**: 8 Stunden (dann automatischer Logout)

### 2. Demo-Daten laden

**Seite**: [gutscheine.html](https://babsyit.github.io/Gutscheine/gutscheine.html)

1. Melden Sie sich an (z.B. als Mitglied mit `demo` / `demo123`)
2. Klicken Sie auf **"Demo-Daten laden"**
3. Es werden 5 Beispiel-Gutscheine erstellt:
   - 3 aktive Gutscheine (2x physisch, 1x online)
   - 2 eingelöste Gutscheine
4. **Status-Anzeige** zeigt: "5 lokale Änderung(en) | Sync zur zentralen DB ausstehend"

### 3. Gutscheine ansehen

Die Gutschein-Karten zeigen:
- ✅ **Aktiv** (grün) oder ✅ **Eingelöst** (grau)
- Gutschein-Code (z.B. BABSY-ETRI-2024)
- Partner-Name
- Beschreibung
- Erstellt am / Eingelöst am

### 4. QR-Code Scanning (Physische Partner)

**Beispiel**: E-TriColor, Uta Grütter Photography, Babycomeback

1. Öffnen Sie [partner-qrcodes.html](https://babsyit.github.io/Gutscheine/partner-qrcodes.html)
2. Melden Sie sich als Partner an (z.B. `etricolor` / `partner123`)
3. Suchen Sie den Partner (z.B. E-TriColor)
3. **Demo-Szenario**:
   - In der Realität: Kunde scannt QR-Code im Laden
   - Für die Demo: Screenshot vom QR-Code machen
4. Zurück zu [gutscheine.html](https://babsyit.github.io/Gutscheine/gutscheine.html)
5. Bei einem aktiven Gutschein: **"QR scannen"** klicken
6. Kamera-Zugriff erlauben
7. QR-Code vor die Kamera halten
8. ✅ **Erfolgsmeldung**: "Gutschein erfolgreich eingelöst!"
9. Gutschein wird als "Eingelöst" markiert

**Wichtig**: Der QR-Code muss zum Partner passen! Sonst erscheint: "Falscher Partner!"

### 5. Online-Gutschein einlösen

**Beispiel**: KidisArt, ZOUTS!

1. Bei einem Online-Partner: **"Code zeigen"** klicken
2. Gutschein-Code wird angezeigt mit Anleitung:
   ```
   1. Besuchen Sie die Website des Partners
   2. Geben Sie den Code im Checkout ein
   3. Der Rabatt wird automatisch angewendet
   ```

### 6. Zentrale Synchronisation (Demo)

**Zwei Varianten**:

#### A) Manueller Export (Empfohlen für Demo)

1. Auf [gutscheine.html](https://babsyit.github.io/Gutscheine/gutscheine.html): **"Export"** klicken
2. Datei `vouchers.json` wird heruntergeladen
3. **Zeigen Sie den Inhalt**: Vollständige Gutschein-Daten im JSON-Format
4. In der Realität: Diese Datei würde automatisch zu `data/vouchers.json` synchronisiert

**Erklärung für die Demo**:
> "In einem echten System würde dies automatisch passieren. Die lokalen Änderungen werden exportiert und mit der zentralen Datenbank synchronisiert. Bei Babsy kann man dann im Admin-Dashboard alle Transaktionen sehen."

#### B) GitHub Actions (Manuelle Trigger)

**Für fortgeschrittene Demo**:

1. Gehen Sie zu: https://github.com/BabsyIT/Gutscheine/actions
2. Wählen Sie: **"Manage Vouchers"**
3. Klicken Sie: **"Run workflow"**
4. Eingaben:
   - Action: `generate` oder `redeem`
   - Partner Name: z.B. "E-TriColor"
   - Customer ID: z.B. "kunde@babsy.ch"
   - Voucher Code (bei redeem): z.B. "BABSY-ETRI-2024"
5. Das Workflow updated automatisch `data/vouchers.json`

### 7. Admin Dashboard ansehen

**Seite**: [admin.html](https://babsyit.github.io/Gutscheine/admin.html)

1. Melden Sie sich als Mitarbeiter an (z.B. `admin` / `babsy2025`)
2. Zeigt Babsy's Perspektive:
- 📊 **Statistiken**: Gesamt / Aktiv / Eingelöst / Partner
- 🏪 **Partner-Breakdown**: Gutscheine pro Partner
- 📋 **Vollständige Tabelle**: Alle Gutscheine mit Status

**Demo-Tipp**: Öffnen Sie dies in einem zweiten Browser-Tab, um Live-Updates zu zeigen.

## Technische Details

### Hybrid Storage System

```javascript
// Beim Laden:
1. Laden von data/vouchers.json (zentral)
2. Laden von localStorage (lokal)
3. Merge: Zentral + Nur-Lokal
4. Status-Anzeige updaten

// Beim Speichern:
1. In localStorage speichern (sofort)
2. "Pending Sync" Flag setzen
3. Export-Option für manuelle Sync
```

### Daten-Struktur

```json
{
  "vouchers": [
    {
      "id": "voucher-1234567890",
      "code": "BABSY-A1B2-C3D4-E5F6",
      "partner": "E-TriColor",
      "customerId": "kunde@babsy.ch",
      "description": "10% Rabatt auf alle Produkte",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "isRedeemed": false,
      "redeemedAt": null,
      "redeemedBy": null,
      "partnerType": "physical"
    }
  ],
  "stats": {
    "total": 1,
    "active": 1,
    "redeemed": 0
  },
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

### QR-Code Format

```json
{
  "type": "BABSY_PARTNER",
  "partner": "E-TriColor",
  "category": "Print & Druck"
}
```

## Demo-Szenarien

### Szenario 1: Physischer Laden

**Ablauf**:
1. Kunde erhält Gutschein von Babsy
2. Kunde geht zu E-TriColor Laden
3. Im Laden klebt ein QR-Code an der Kasse
4. Kunde öffnet gutscheine.html auf dem Smartphone
5. Kunde scannt QR-Code
6. Validierung: Partner stimmt überein ✅
7. Gutschein wird eingelöst
8. Partner sieht Bestätigung
9. Babsy sieht Transaktion im Admin-Dashboard

### Szenario 2: Online-Partner

**Ablauf**:
1. Kunde erhält Gutschein für KidisArt
2. Kunde klickt "Code zeigen"
3. Notiert sich: BABSY-KIDS-8142
4. Geht zu www.kidisart.ch
5. Gibt Code im Checkout ein
6. Rabatt wird angewendet
7. Partner markiert manuell als eingelöst (in Realität automatisch)

### Szenario 3: Babsy Auswertung

**Ablauf**:
1. Babsy öffnet admin.html
2. Sieht Gesamtstatistik:
   - 120 Gutscheine gesamt
   - 85 aktiv
   - 35 eingelöst
3. Partner-Breakdown:
   - E-TriColor: 15 gesamt, 10 eingelöst
   - KidisArt: 8 gesamt, 3 eingelöst
4. Filtert nach Partner oder Zeitraum
5. Exportiert Report für Buchhaltung

## Offline-Fähigkeit

Das System funktioniert auch ohne Internet:

1. **Erstmalig laden**: Seite besuchen (cached)
2. **Offline gehen**: Flugmodus aktivieren
3. **Gutscheine ansehen**: Lokale Kopie verfügbar
4. **Einlösen**: Lokal gespeichert
5. **Online kommen**: Automatischer Sync zur zentralen DB
6. Status zeigt: "Mit zentraler Datenbank synchronisiert"

## Limitierungen (Demo vs. Produktion)

| Feature | Demo | Produktion |
|---------|------|------------|
| Datenbank | JSON-Datei | PostgreSQL/MongoDB |
| Authentifizierung | Basis (JSON-basiert) | OAuth/JWT + Password-Hashing |
| Benutzerverwaltung | Statische JSON-Dateien | Dynamisches User-Management |
| Passwort-Sicherheit | Klartext (nur Demo!) | Bcrypt/Argon2 Hashing |
| Sync | Manuell | Automatisch |
| E-Mail Versand | Simuliert | Echt (SendGrid/AWS SES) |
| Partner-API | Keine | REST API |
| Analytics | Basis | Google Analytics/Mixpanel |
| Backup | Git History | Cloud Backup |

**⚠️ Sicherheitshinweis**: Die Demo-Authentifizierung verwendet Passwörter im Klartext und ist NUR für Demonstrationszwecke geeignet. In Produktion müssen Passwörter gehasht werden!

## Nächste Schritte für Produktion

1. **Backend API**: Node.js/Express oder Python/FastAPI
2. **Echte Datenbank**: PostgreSQL mit Prisma ORM
3. **Authentifizierung**: Auth0 oder Firebase Auth
4. **Partner Portal**: Separate Admin-Oberfläche für Partner
5. **E-Mail Service**: Integration mit SendGrid
6. **Mobile App**: React Native für iOS/Android
7. **Analytics**: Tracking von Gutschein-Performance
8. **Zahlungs-Integration**: Stripe für Babsy-Provisionen

## Kontakt

Bei Fragen oder Anpassungen:
- GitHub: https://github.com/BabsyIT/Gutscheine
- Issues: https://github.com/BabsyIT/Gutscheine/issues

---

**Viel Erfolg bei der Demo! 🎉**
