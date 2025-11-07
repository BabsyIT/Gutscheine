# Self-Hosted Supabase Setup - Babsy Voucher System

Komplette Anleitung zum Betrieb des Babsy Gutschein-Systems mit **vollständig self-hosted** Infrastruktur.

## 🎯 Vorteile Self-Hosted

- ✅ **Volle Kontrolle** über alle Daten
- ✅ **Datenschutz** - Daten bleiben in der Schweiz/EU
- ✅ **Keine Cloud-Kosten** - nur VPS/Server Kosten
- ✅ **Keine Vendor Lock-in** - komplett Open Source
- ✅ **Besser skalierbar** für große Datenmengen
- ✅ **DSGVO-konform** einfacher zu implementieren

## 📋 Was ist enthalten?

### Core Services

1. **PostgreSQL 15** (Supabase-Image mit Extensions)
   - UUID Support
   - pgcrypto für Verschlüsselung
   - pg_stat_statements für Performance Monitoring
   - Volle SQL-Funktionalität

2. **pgAdmin** - Web-basierte Datenbank-Verwaltung
   - Grafisches Interface für PostgreSQL
   - Query Builder
   - Import/Export
   - Backup Management

3. **PostgREST** - Auto-generierte REST API
   - Automatische API aus DB-Schema
   - JWT Authentication Support
   - Row-Level Security

4. **Backend API** - Custom Express API
   - JWT Authentication
   - Voucher Management
   - Partner Management

5. **Redis** - Caching & Rate Limiting
   - Session Storage
   - API Rate Limiting
   - Cache Layer

6. **Automated Backups**
   - Tägliche PostgreSQL Backups
   - 7 Tage / 4 Wochen / 6 Monate Retention
   - Einfache Restore-Funktion

### Optional (Monitoring)

7. **Prometheus** - Metrics Collection
8. **Grafana** - Dashboards & Visualization

## ⚡ Quick Start (10 Minuten!)

### 1. Voraussetzungen

```bash
# Docker & Docker Compose
docker --version  # >= 20.10
docker-compose --version  # >= 2.0

# Git
git --version
```

### 2. Setup

```bash
# Clone Repository
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine

# Setup (erstellt .env und Ordner)
make setup

# Secrets generieren
make secrets
```

**Output von `make secrets`:**
```
🔐 Generating JWT secrets...

JWT_SECRET:
xyz123abc...

JWT_REFRESH_SECRET:
abc789xyz...
```

### 3. Konfiguration

```bash
# .env bearbeiten
nano .env
```

**Mindestens ändern:**

```bash
# PostgreSQL
POSTGRES_PASSWORD=DeinSicheresPasswort123!

# JWT Secrets (von make secrets kopieren)
JWT_SECRET=dein-generierter-secret-hier
JWT_REFRESH_SECRET=dein-refresh-secret-hier

# pgAdmin
PGADMIN_PASSWORD=DeinPgAdminPasswort123!

# Redis
REDIS_PASSWORD=DeinRedisPasswort123!
```

### 4. Starten!

```bash
# Alle Services starten
make start

# Oder manuell:
docker-compose -f docker-compose.selfhosted.yml up -d
```

**Services starten dauert ~30 Sekunden**

### 5. Datenbank initialisieren

```bash
# Prisma Schema zu DB pushen
make db-init

# Bestehende Daten migrieren (optional)
make db-migrate
```

### 6. Verifizieren

```bash
# Health Check
make health

# Oder manuell:
curl http://localhost:3000/health
curl http://localhost:8080/health
```

## ✅ Fertig!

Öffne im Browser:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
- **PostgREST**: http://localhost:3001

## 📊 Service-Übersicht

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| Frontend | 8080 | http://localhost:8080 | - |
| Backend API | 3000 | http://localhost:3000 | JWT Token |
| PostgreSQL | 5432 | localhost:5432 | POSTGRES_USER/PASSWORD |
| pgAdmin | 5050 | http://localhost:5050 | PGADMIN_EMAIL/PASSWORD |
| PostgREST | 3001 | http://localhost:3001 | JWT Token |
| Redis | 6379 | localhost:6379 | REDIS_PASSWORD |
| Prometheus | 9090 | http://localhost:9090 | - |
| Grafana | 3002 | http://localhost:3002 | GRAFANA_USER/PASSWORD |

## 🛠️ Makefile Commands

### Basics

```bash
make help          # Alle verfügbaren Commands anzeigen
make setup         # Erstmalige Einrichtung
make secrets       # JWT Secrets generieren
make start         # Alle Services starten
make stop          # Alle Services stoppen
make restart       # Alle Services neu starten
make logs          # Logs anzeigen
make ps            # Container Status
make health        # Health Check
```

### Datenbank

```bash
make db-init       # Schema initialisieren
make db-migrate    # JSON Daten migrieren
make db-studio     # Prisma Studio öffnen
make db-shell      # PostgreSQL Shell öffnen
```

### Backup & Restore

```bash
make backup        # Backup erstellen
make backup-list   # Alle Backups anzeigen
make restore       # Letztes Backup wiederherstellen
make restore BACKUP_FILE=backup.sql  # Spezifisches Backup
```

### Development

```bash
make dev           # Dev-Mode mit Live-Logs
make shell-backend # Backend Container Shell
make shell-postgres # PostgreSQL Container Shell
make test          # Tests ausführen
make test-api      # API Endpoints testen
```

### Maintenance

```bash
make build         # Container neu bauen
make rebuild       # Neu bauen und starten
make clean         # Docker Aufräumen
make update        # Git Pull + Rebuild
```

### Monitoring

```bash
make monitoring    # Mit Prometheus + Grafana starten
make stats         # Container Ressourcen-Nutzung
```

## 💾 Backup & Restore

### Automatische Backups

Backups werden **automatisch täglich** um Mitternacht erstellt:

- Gespeichert in: `supabase/backups/`
- Retention: 7 Tage, 4 Wochen, 6 Monate
- Format: `backup_YYYYMMDD_HHMMSS.sql`

### Manuelles Backup

```bash
# Backup erstellen
make backup

# Output:
# 💾 Creating backup...
# ✅ Backup created: supabase/backups/backup_20250115_143022.sql
```

### Restore

```bash
# Letztes Backup wiederherstellen
make restore

# Spezifisches Backup
make restore BACKUP_FILE=supabase/backups/backup_20250115_143022.sql
```

### Backup zu anderer Maschine kopieren

```bash
# Backup herunterladen
scp user@server:/path/to/Gutscheine/supabase/backups/backup_*.sql ./

# Backup hochladen
scp backup_*.sql user@server:/path/to/Gutscheine/supabase/backups/
```

## 🔐 Sicherheit

### Passwörter ändern

**Nach erstem Start alle Default-Passwörter ändern!**

```bash
# .env bearbeiten
nano .env

# Folgende Werte ändern:
# - POSTGRES_PASSWORD
# - PGADMIN_PASSWORD
# - REDIS_PASSWORD
# - JWT_SECRET (mit make secrets generieren)
# - JWT_REFRESH_SECRET
# - GRAFANA_PASSWORD

# Neu starten
make restart
```

### Firewall Setup

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable

# Interne Ports NICHT öffnen:
# - 5432 (PostgreSQL)
# - 6379 (Redis)
# - 3000 (Backend - via Nginx Proxy)
```

### SSL/HTTPS Setup

**Mit Nginx Reverse Proxy + Let's Encrypt:**

```bash
# Nginx installieren
sudo apt install nginx certbot python3-certbot-nginx

# Nginx Config erstellen
sudo nano /etc/nginx/sites-available/babsy
```

```nginx
# Frontend
server {
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Aktivieren
sudo ln -s /etc/nginx/sites-available/babsy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL Zertifikat
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

### .env Permissions

```bash
# .env sollte nur vom Owner lesbar sein
chmod 600 .env

# Verifizieren
ls -la .env
# Sollte zeigen: -rw------- (600)
```

## 📊 pgAdmin Nutzung

### Erstmaliges Login

1. Öffne http://localhost:5050
2. Login mit:
   - Email: `PGADMIN_EMAIL` aus .env
   - Password: `PGADMIN_PASSWORD` aus .env

### Server hinzufügen (wenn nicht automatisch)

1. **Add New Server**
2. **General Tab**:
   - Name: `Babsy PostgreSQL`
3. **Connection Tab**:
   - Host: `postgres` (Docker network)
   - Port: `5432`
   - Database: `babsy_vouchers`
   - Username: `postgres`
   - Password: `POSTGRES_PASSWORD` aus .env

### Nützliche Queries

```sql
-- Alle Tabellen anzeigen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Anzahl Gutscheine
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_redeemed = true) as redeemed,
    COUNT(*) FILTER (WHERE is_redeemed = false) as active
FROM vouchers;

-- Partner mit meisten Gutscheinen
SELECT
    p.partnername,
    COUNT(v.id) as voucher_count
FROM partners p
LEFT JOIN vouchers v ON p.id = v.partner_id
GROUP BY p.id, p.partnername
ORDER BY voucher_count DESC;

-- Neueste Einlösungen
SELECT
    v.code,
    p.partnername,
    u.name as user_name,
    v.redeemed_at
FROM vouchers v
JOIN partners p ON v.partner_id = p.id
JOIN users u ON v.user_id = u.id
WHERE v.is_redeemed = true
ORDER BY v.redeemed_at DESC
LIMIT 10;
```

## 🔍 Monitoring & Logs

### Logs anzeigen

```bash
# Alle Services
make logs

# Nur Backend
make logs-backend

# Nur PostgreSQL
make logs-postgres

# Letzte 100 Zeilen
docker-compose -f docker-compose.selfhosted.yml logs --tail=100
```

### Container Status

```bash
# Status aller Container
make ps

# Ressourcen-Nutzung
make stats
```

### Prometheus + Grafana

```bash
# Mit Monitoring starten
make monitoring

# Öffne:
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3002
```

**Grafana Dashboard importieren:**

1. Login mit `GRAFANA_USER` / `GRAFANA_PASSWORD`
2. **+** → **Import**
3. Dashboard ID: `9628` (PostgreSQL Overview)
4. **Load** → **Import**

## 🚀 Production Deployment

### VPS Anforderungen

**Minimum:**
- 2 GB RAM
- 2 CPU Cores
- 20 GB SSD
- Ubuntu 22.04 LTS

**Empfohlen:**
- 4 GB RAM
- 4 CPU Cores
- 50 GB SSD
- Ubuntu 22.04 LTS

**Anbieter-Empfehlungen:**
- **Hetzner** (Deutschland): ab 4,51€/Monat
- **Netcup** (Deutschland): ab 6,00€/Monat
- **DigitalOcean** (Frankfurt): ab $12/Monat
- **Contabo** (Deutschland): ab 6,99€/Monat

### Setup auf VPS

```bash
# 1. SSH in VPS
ssh root@your-server-ip

# 2. System Update
apt update && apt upgrade -y

# 3. Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Docker Compose installieren
apt install docker-compose-plugin -y

# 5. Projekt klonen
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine

# 6. Setup
make setup
nano .env  # Production Werte einfügen

# 7. Starten
make start

# 8. Datenbank initialisieren
make db-init
make db-migrate  # optional

# 9. Nginx + SSL (siehe oben)
```

### Docker Compose Auto-Start

```bash
# Systemd Service erstellen
sudo nano /etc/systemd/system/babsy-vouchers.service
```

```ini
[Unit]
Description=Babsy Voucher System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/Gutscheine
ExecStart=/usr/bin/docker-compose -f docker-compose.selfhosted.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.selfhosted.yml down
User=root

[Install]
WantedBy=multi-user.target
```

```bash
# Aktivieren
sudo systemctl enable babsy-vouchers
sudo systemctl start babsy-vouchers

# Status prüfen
sudo systemctl status babsy-vouchers
```

## 🔧 Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
make logs

# Spezifischer Service
docker-compose -f docker-compose.selfhosted.yml logs postgres

# Container neu starten
make restart
```

### PostgreSQL Connection Error

```bash
# Prüfe ob PostgreSQL läuft
docker-compose -f docker-compose.selfhosted.yml ps postgres

# Prüfe Logs
make logs-postgres

# Connection testen
docker-compose -f docker-compose.selfhosted.yml exec postgres psql -U postgres -d babsy_vouchers -c "SELECT 1"
```

### Disk Space voll

```bash
# Disk Space prüfen
df -h

# Docker aufräumen
make clean

# Alte Logs löschen
rm -rf backend/logs/*.log

# Alte Backups löschen (älter als 30 Tage)
find supabase/backups -name "*.sql" -mtime +30 -delete
```

### Performance Probleme

```bash
# Container Ressourcen prüfen
make stats

# PostgreSQL Performance
docker-compose -f docker-compose.selfhosted.yml exec postgres psql -U postgres -d babsy_vouchers -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"

# Slow Queries finden
docker-compose -f docker-compose.selfhosted.yml exec postgres psql -U postgres -d babsy_vouchers -c "SELECT query, calls, total_exec_time, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## 📈 Skalierung

### Mehr RAM für PostgreSQL

```yaml
# In docker-compose.selfhosted.yml
postgres:
  environment:
    # Shared Buffers (25% of RAM)
    POSTGRES_SHARED_BUFFERS: 1GB
    # Effective Cache Size (50% of RAM)
    POSTGRES_EFFECTIVE_CACHE_SIZE: 2GB
```

### Connection Pooling

Füge **PgBouncer** hinzu:

```yaml
pgbouncer:
  image: edoburu/pgbouncer:latest
  environment:
    DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/babsy_vouchers
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
  ports:
    - "6432:5432"
```

Backend `DATABASE_URL` ändern zu: `localhost:6432`

## 💰 Kosten-Vergleich

### Cloud (Supabase)

| Tier | Preis/Monat | Limits |
|------|------------|--------|
| Free | $0 | 500 MB DB, 2 GB Bandwidth |
| Pro | $25 | 8 GB DB, 50 GB Bandwidth |
| Team | $599 | 32 GB DB, 250 GB Bandwidth |

### Self-Hosted (Hetzner VPS)

| VPS | Preis/Monat | Specs |
|-----|------------|-------|
| CX21 | 4,51€ | 2 vCPU, 4 GB RAM, 40 GB SSD |
| CX31 | 8,77€ | 2 vCPU, 8 GB RAM, 80 GB SSD |
| CX41 | 15,97€ | 4 vCPU, 16 GB RAM, 160 GB SSD |

**Self-Hosted ist günstiger ab ~100+ Nutzer!**

## ✅ Checkliste

- [ ] Docker installiert
- [ ] Repository geklont
- [ ] `.env` konfiguriert
- [ ] Alle Passwörter geändert
- [ ] Services gestartet (`make start`)
- [ ] Datenbank initialisiert (`make db-init`)
- [ ] Health Check OK (`make health`)
- [ ] Backup getestet (`make backup`)
- [ ] Firewall konfiguriert
- [ ] SSL Zertifikat installiert
- [ ] Auto-Start aktiviert
- [ ] Monitoring optional aktiviert

## 📚 Weitere Ressourcen

- **[QUICKSTART.md](QUICKSTART.md)** - Schnelleinstieg
- **[DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)** - Cloud Deployment
- **[PRODUCTION-READINESS.md](PRODUCTION-READINESS.md)** - Production Plan
- **[backend/README.md](backend/README.md)** - API Dokumentation

## 🆘 Support

- **GitHub Issues**: https://github.com/BabsyIT/Gutscheine/issues
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Docker Docs**: https://docs.docker.com/

---

**Viel Erfolg mit deinem Self-Hosted Setup! 🚀**
