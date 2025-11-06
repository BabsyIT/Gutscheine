# 🚀 Quick Start - Babsy Voucher System mit Docker

Die schnellste Methode, um das Babsy Gutschein-System produktiv zu starten!

## ⏱️ Zeitaufwand: ~30 Minuten

1. Supabase Setup: **10 Minuten**
2. Docker Installation: **5 Minuten**
3. Projekt Setup: **10 Minuten**
4. Deployment: **5 Minuten**

---

## Schritt 1: Supabase Datenbank erstellen (10 Min)

### 1.1 Account erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke **"Start your project"**
3. Melde dich mit GitHub/Google an

### 1.2 Neues Projekt erstellen

1. Klicke **"New Project"**
2. Fülle aus:
   - **Name**: `babsy-vouchers`
   - **Database Password**: Wähle ein sicheres Passwort (SPEICHERN!)
   - **Region**: `Europe West (Frankfurt)` (nächste zu Schweiz)
3. Klicke **"Create new project"**
4. ⏳ Warte ~2 Minuten

### 1.3 Connection String kopieren

1. Gehe zu **Settings** (⚙️) → **Database**
2. Scrolle zu **Connection string** → **URI**
3. Kopiere den String (sieht so aus):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```
4. Ersetze `[YOUR-PASSWORD]` mit deinem Passwort

✅ **Supabase fertig!**

---

## Schritt 2: Docker installieren (5 Min)

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Danach neu anmelden** (logout/login)

### macOS

```bash
brew install --cask docker
```

Öffne Docker Desktop nach Installation.

### Windows

1. Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Installieren
3. Computer neu starten

### Testen

```bash
docker --version
# Sollte zeigen: Docker version 20.x.x oder höher

docker-compose --version
# Sollte zeigen: Docker Compose version 2.x.x oder höher
```

✅ **Docker installiert!**

---

## Schritt 3: Projekt Setup (10 Min)

### 3.1 Repository klonen

```bash
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine
```

### 3.2 Environment konfigurieren

```bash
# Kopiere Vorlage
cp .env.docker.example .env

# Bearbeite .env
nano .env  # oder: code .env (VS Code)
```

**Fülle aus:**

```bash
# 1. DATABASE_URL (von Supabase kopiert)
DATABASE_URL="postgresql://postgres:DEIN-PASSWORT@db.abcdefg.supabase.co:5432/postgres"

# 2. JWT Secrets generieren (siehe unten)
JWT_SECRET="dein-generierter-secret"
JWT_REFRESH_SECRET="dein-generierter-refresh-secret"

# 3. CORS
ALLOWED_ORIGINS="http://localhost:8080,https://deine-domain.com"

# 4. Logging
LOG_LEVEL="info"
```

**JWT Secrets generieren:**

```bash
# Secret 1
openssl rand -base64 32

# Secret 2
openssl rand -base64 32
```

Kopiere die Outputs in `.env`.

### 3.3 Datenbank initialisieren

```bash
cd backend

# Dependencies installieren
npm install

# Prisma Schema zu Supabase pushen
npx prisma db push

# Prisma Client generieren
npx prisma generate
```

**Verifizieren in Supabase:**
- Gehe zu **Table Editor**
- Du solltest sehen: `users`, `partners`, `vouchers`, `sessions`, `audit_log`

### 3.4 Daten migrieren (Optional)

Wenn du bestehende JSON-Daten hast:

```bash
# Noch im backend/ Ordner
node scripts/migrate-json-to-db.js
```

Output:
```
📦 Migrating Partners...
  ✅ Migrated: E-TriColor
  ✅ Migrated: proinsura
  ...

👥 Migrating Members...
  ✅ Migrated: mitglied1
  ...

✅ Migration Completed Successfully!
```

### 3.5 Zurück zum Root

```bash
cd ..
```

✅ **Projekt konfiguriert!**

---

## Schritt 4: Starten! (5 Min)

### 4.1 Docker Container starten

```bash
# Alle Services starten
docker-compose up -d
```

Output:
```
Creating babsy-redis ... done
Creating babsy-backend ... done
Creating babsy-frontend ... done
```

### 4.2 Status prüfen

```bash
# Container anschauen
docker-compose ps

# Sollte zeigen:
# babsy-backend    Up      0.0.0.0:3000->3000/tcp
# babsy-frontend   Up      0.0.0.0:8080->8080/tcp
# babsy-redis      Up      6379/tcp
```

### 4.3 Health Checks

```bash
# Backend
curl http://localhost:3000/health
# Sollte returnen: {"status":"ok",...}

# Frontend
curl http://localhost:8080/health
# Sollte returnen: OK
```

### 4.4 Logs anschauen

```bash
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend
```

Drücke `Ctrl+C` zum Stoppen.

✅ **System läuft!**

---

## 🎉 Fertig! System testen

### Frontend öffnen

Browser: **http://localhost:8080**

Du solltest die Startseite sehen mit:
- Partnerkarte
- Gutschein-Verwaltung
- Login-Funktion

### API testen

```bash
# Test Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

Du solltest ein JWT Token erhalten!

### Partner anschauen

```bash
curl http://localhost:3000/api/partners
```

Gibt Liste aller Partner zurück.

---

## 📱 URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **Supabase Dashboard**: https://app.supabase.com

---

## 🛠️ Wichtige Commands

```bash
# Stoppen
docker-compose stop

# Starten
docker-compose start

# Neu starten
docker-compose restart

# Komplett runterfahren
docker-compose down

# Mit Rebuild
docker-compose up --build -d

# Logs
docker-compose logs -f

# In Container einloggen
docker-compose exec backend sh
```

---

## 🔐 Standard-Logins

Nach Migration:

### Mitglieder
- Username: `demo` / Password: `demo123`
- Username: `mitglied1` / Password: `mitglied123`

### Partner
- Username: `etricolor` / Password: `ChangeMePlease123!`
- Username: `kidisart` / Password: `ChangeMePlease123!`

### Admin
- Username: `admin` / Password: `babsy2025`

**⚠️ WICHTIG: Passwörter nach erstem Login ändern!**

---

## 🚀 Production Deployment

### Option A: VPS (DigitalOcean, Hetzner, etc.)

```bash
# SSH in VPS
ssh root@your-vps-ip

# Installiere Docker (siehe oben)

# Clone Repo
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine

# Setup .env (mit Production-Werten!)
cp .env.docker.example .env
nano .env

# Starten
docker-compose up -d

# Setup Nginx (siehe DOCKER-DEPLOYMENT.md)
```

### Option B: Render.com (1-Click Deploy)

1. Gehe zu [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repo
4. Select **Docker**
5. Environment: Paste `.env` Werte
6. **Create Web Service**

Fertig! Render gibt dir eine URL.

### Option C: Railway.app

1. [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Select repo
4. Add environment variables
5. Deploy!

---

## 🆘 Probleme?

### Container startet nicht

```bash
# Logs checken
docker-compose logs backend

# Häufige Fehler:
# - DATABASE_URL falsch
# - JWT_SECRET fehlt
# - Port bereits benutzt
```

### Datenbank-Verbindung

```bash
# Testen
docker-compose exec backend node -e "require('./src/config/database').prisma.\$connect().then(() => console.log('OK'))"
```

### Port bereits benutzt

```bash
# Port 3000 freigeben
sudo lsof -i :3000
sudo kill -9 <PID>

# Port 8080 freigeben
sudo lsof -i :8080
sudo kill -9 <PID>
```

### Alles neu bauen

```bash
# Container stoppen
docker-compose down

# Images löschen
docker-compose down --rmi all

# Volumes löschen
docker-compose down -v

# Neu bauen
docker-compose up --build -d
```

---

## 📚 Weitere Dokumentation

- **[DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)** - Vollständiger Deployment-Guide
- **[PRODUCTION-READINESS.md](PRODUCTION-READINESS.md)** - Production Planung
- **[backend/README.md](backend/README.md)** - Backend API Docs

---

## ✅ Checkliste

- [ ] Supabase Account erstellt
- [ ] Datenbank erstellt
- [ ] Connection String kopiert
- [ ] Docker installiert
- [ ] Repository geklont
- [ ] `.env` konfiguriert
- [ ] Datenbank initialisiert (`prisma db push`)
- [ ] Daten migriert (optional)
- [ ] Docker Container gestartet
- [ ] Health Checks OK
- [ ] Frontend erreichbar (http://localhost:8080)
- [ ] API erreichbar (http://localhost:3000)
- [ ] Login funktioniert

---

## 🎯 Nächste Schritte

1. **Passwörter ändern** - Alle Default-Passwörter ändern!
2. **Domain einrichten** - SSL Zertifikat mit Let's Encrypt
3. **Monitoring** - Sentry für Error Tracking
4. **Backups** - Automatische DB Backups einrichten
5. **Emails** - SendGrid Integration

---

**Viel Erfolg! 🚀**

Bei Fragen: [GitHub Issues](https://github.com/BabsyIT/Gutscheine/issues)
