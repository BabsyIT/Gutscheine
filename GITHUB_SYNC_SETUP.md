# GitHub Auto-Sync Setup Anleitung

Die Babsy Gutschein-Verwaltung unterstützt jetzt **automatische Synchronisation** mit GitHub! Neue Gutscheine werden automatisch in Ihr GitHub Repository gespeichert.

## Vorteile

- ✅ **Automatische Synchronisation**: Keine manuellen Uploads mehr
- ✅ **Zentrale Datenhaltung**: Alle Gutscheine in `data/vouchers.json`
- ✅ **Git-History**: Vollständige Versionshistorie aller Änderungen
- ✅ **Multi-Device**: Funktioniert auf allen Geräten
- ✅ **Backup**: GitHub dient als Backup

## Setup Schritte

### 1. GitHub Personal Access Token erstellen

1. Gehen Sie zu GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Klicken Sie auf **"Generate new token (classic)"**
3. Token-Name: z.B. "Babsy Gutscheine Auto-Sync"
4. Expiration: Wählen Sie eine passende Laufzeit (z.B. 90 days)
5. Scopes: **Aktivieren Sie `repo`** (Full control of private repositories)
6. Klicken Sie auf **"Generate token"**
7. **WICHTIG**: Kopieren Sie den Token sofort - er wird nur einmal angezeigt!

Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Auto-Sync konfigurieren

1. Öffnen Sie [code.html](code.html) oder [gutscheine.html](gutscheine.html)
2. Klicken Sie auf den **"Config"** Button (Zahnrad-Symbol)
3. Füllen Sie das Formular aus:

   **Aktivieren**: ☑️ Checkbox aktivieren

   **GitHub Personal Access Token**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   (Der Token aus Schritt 1)

   **Repository Owner**: Ihr GitHub-Benutzername oder Organisation
   (z.B. `stefanmustermann`)

   **Repository Name**: Name Ihres Repositories
   (z.B. `Babsy-Gutscheine` oder wie Ihr Repo heißt)

   **Branch**: `main` (oder `master`, je nach Ihrem Standard-Branch)

4. Klicken Sie auf **"Test"** um die Verbindung zu prüfen
5. Bei Erfolg: Klicken Sie auf **"Speichern"**

### 3. Nutzung

#### Automatischer Sync

Nach dem Setup synchronisieren sich neue Gutscheine automatisch:

1. **Gutschein erstellen** (auf karte.html, code.html, etc.)
2. **Auto-Sync** Button klicken (grüner Sync-Button)
3. ✅ Fertig! Die `vouchers.json` wird automatisch auf GitHub aktualisiert

#### Sync-Status

- 🟢 **Grün**: Synchronisiert
- 🟠 **Orange**: Änderungen ausstehend (X Änderung(en))
- 🔴 **Rot**: Fehler beim Laden

## Häufige Probleme

### "GitHub API error: 404"
- ❌ Repository nicht gefunden
- ✅ Prüfen Sie Owner und Repo-Name
- ✅ Prüfen Sie, ob das Repository existiert

### "GitHub API error: 401"
- ❌ Ungültiger oder abgelaufener Token
- ✅ Erstellen Sie einen neuen Token
- ✅ Prüfen Sie, ob der Token die `repo` Berechtigung hat

### "GitHub API error: 403"
- ❌ Keine Schreibrechte
- ✅ Prüfen Sie Token-Berechtigungen
- ✅ Prüfen Sie Repository-Berechtigungen

### "File doesn't exist yet"
- ✅ Normal beim ersten Sync - Datei wird automatisch erstellt

## Sicherheit

⚠️ **WICHTIG**: Der Token wird im Browser localStorage gespeichert.

### Best Practices:

1. **Token-Ablauf**: Verwenden Sie kurzlebige Tokens (90 Tage)
2. **Berechtigungen**: Nur `repo` Berechtigung vergeben
3. **Privates Repository**: Verwenden Sie ein privates Repository
4. **Token-Rotation**: Erneuern Sie den Token regelmäßig
5. **Kein Sharing**: Teilen Sie den Token niemals mit anderen

## Workflow

```
Gutschein erstellen
        ↓
In pending_vouchers_export Queue
        ↓
Auto-Sync Button klicken
        ↓
GitHub API Update
        ↓
vouchers.json aktualisiert
        ↓
Alle Geräte sehen neue Daten
```

## Manueller Fallback

Falls Auto-Sync nicht verfügbar ist:

1. Klicken Sie auf **"Export PDF"** für Ausdrucke
2. Oder exportieren Sie manuell als JSON (wenn implementiert)

## Support

Bei Problemen:

1. Öffnen Sie die Browser-Konsole (F12)
2. Prüfen Sie Fehlermeldungen
3. Testen Sie die Verbindung im Config-Dialog
4. Prüfen Sie GitHub-Status: https://www.githubstatus.com/

## Technische Details

- **GitHub API**: [Contents API](https://docs.github.com/en/rest/repos/contents)
- **Authentifizierung**: Personal Access Token
- **Rate Limit**: 5000 Requests/Stunde (authentifiziert)
- **Datei-Encoding**: Base64
- **Merge-Strategie**: Pending Vouchers überschreiben Zentrale DB

---

**Version**: 1.0
**Datum**: 2025-01-02
