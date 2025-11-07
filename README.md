# 🎫 Babsy Partnergutscheine System

Vollständiges, production-ready Gutschein-Verwaltungssystem mit Docker + Supabase Support.

## 🌟 Features

- 🎫 **Digitale Gutschein-Verwaltung** - Generieren, verwalten, einlösen
- 🗺️ **Interaktive Partner-Karte** - 20+ Partner auf Schweizer Karte
- 📱 **QR-Code Scanner** - Kamera-basierte Einlösung im Laden
- 🔐 **Sichere Authentifizierung** - JWT + bcrypt, Role-based Access Control
- 💾 **Flexible Datenspeicherung** - Cloud (Supabase) oder Self-Hosted
- 🐳 **Docker-basiert** - Production-ready Container Setup
- 📊 **Admin Dashboard** - Statistiken und Auswertungen
- 🔄 **Automatische Backups** - Tägliche PostgreSQL Backups
- 📈 **Monitoring** - Optional mit Prometheus + Grafana

## 🚀 Quick Start

### Option 1: Self-Hosted (Empfohlen)

Vollständige Kontrolle über alle Daten - läuft auf deinem eigenen Server!

```bash
# 1. Repository klonen
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine

# 2. Setup (automatisch)
./setup-selfhosted.sh

# 3. Datenbank initialisieren
cd backend && npx prisma db push

# Fertig! 🎉
# Frontend: http://localhost:8080
# Backend:  http://localhost:3000
# pgAdmin:  http://localhost:5050
```

**📖 Vollständige Anleitung:** [SELF-HOSTED-SUPABASE.md](SELF-HOSTED-SUPABASE.md)

### Option 2: Cloud (Supabase)

Einfachster Start mit Supabase Cloud Database:

```bash
# 1. Repository klonen
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine

# 2. Supabase Account erstellen (kostenlos)
# → supabase.com

# 3. Environment konfigurieren
cp .env.docker.example .env
nano .env  # DATABASE_URL von Supabase einfügen

# 4. Starten
docker-compose up -d
```

**📖 Vollständige Anleitung:** [QUICKSTART.md](QUICKSTART.md)

## 📁 Projektstruktur

```
Gutscheine/
├── backend/                    # 🚀 Express REST API
│   ├── src/
│   │   ├── routes/            # API Endpoints
│   │   ├── services/          # Business Logic
│   │   ├── middleware/        # Auth, Logging, Errors
│   │   └── config/            # Configuration
│   ├── prisma/
│   │   └── schema.prisma      # Database Schema
│   └── Dockerfile
├── frontend-docker/           # 🎨 Nginx Frontend Container
├── supabase/                  # 🗄️ Self-Hosted DB Config
│   ├── init/                  # Init Scripts
│   └── backups/               # Automated Backups
├── data/                      # 📦 Original JSON Data
├── js/                        # 💻 Frontend JavaScript
├── images/                    # 🖼️ Partner Logos
├── docker-compose.yml         # ☁️ Cloud Setup
├── docker-compose.selfhosted.yml  # 🏠 Self-Hosted Setup
├── Makefile                   # 🛠️ Quick Commands
└── *.html                     # 📄 Frontend Pages
```

## 🛠️ Technologie Stack

### Backend
- **Runtime**: Node.js 18 LTS
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Caching**: Redis

### Frontend
- **Core**: Vanilla JavaScript
- **Server**: Nginx
- **Map**: Leaflet.js
- **QR**: html5-qrcode
- **Icons**: Font Awesome

### DevOps
- **Container**: Docker + Docker Compose
- **Database**: Supabase oder Self-Hosted PostgreSQL
- **Monitoring**: Prometheus + Grafana (optional)
- **Backups**: Automated daily backups

## 🎯 Deployment-Optionen

### 1️⃣ Self-Hosted (Volle Kontrolle)

**Vorteile:**
- ✅ Volle Datenkontrolle
- ✅ DSGVO-konform
- ✅ Keine Cloud-Kosten
- ✅ Unbegrenzte Skalierung

**Kosten:** ~5-15€/Monat (VPS bei Hetzner/Netcup)

**Setup:** [SELF-HOSTED-SUPABASE.md](SELF-HOSTED-SUPABASE.md)

### 2️⃣ Cloud mit Supabase

**Vorteile:**
- ✅ Schnellster Start
- ✅ Automatische Backups
- ✅ Managed Database
- ✅ Free Tier verfügbar

**Kosten:** $0-25/Monat

**Setup:** [QUICKSTART.md](QUICKSTART.md)

### 3️⃣ Hybrid

**Vorteile:**
- ✅ Backend self-hosted
- ✅ Database in Cloud
- ✅ Best of both worlds

**Setup:** [DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)

## 📚 Dokumentation

| Dokument | Beschreibung | Zeitaufwand |
|----------|--------------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Schnellstart mit Cloud | 30 Min |
| [SELF-HOSTED-SUPABASE.md](SELF-HOSTED-SUPABASE.md) | Self-Hosted Setup | 20 Min |
| [DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md) | Deployment Guide | - |
| [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md) | Production Planning | - |
| [backend/README.md](backend/README.md) | API Dokumentation | - |

## 🎮 Makefile Commands

Das Projekt enthält ein **Makefile** mit praktischen Shortcuts:

```bash
# Setup & Start
make setup          # Erstmalige Einrichtung
make start          # Alle Services starten
make stop           # Alle Services stoppen
make restart        # Neu starten
make logs           # Logs anzeigen

# Datenbank
make db-init        # Schema initialisieren
make db-migrate     # JSON Daten migrieren
make db-shell       # PostgreSQL Shell

# Backup & Restore
make backup         # Backup erstellen
make restore        # Letztes Backup wiederherstellen
make backup-list    # Alle Backups anzeigen

# Development
make dev            # Dev-Mode mit Live-Logs
make test           # Tests ausführen
make health         # Health Check

# Hilfe
make help           # Alle Commands anzeigen
```

## 🔐 Sicherheit

- ✅ **JWT Authentication** - Kurze Access Tokens (15 Min) + Refresh Tokens (7 Tage)
- ✅ **Password Hashing** - bcrypt mit 12 Rounds
- ✅ **Rate Limiting** - 5 Login-Versuche pro 15 Minuten
- ✅ **CORS** - Konfigurierbare Origins
- ✅ **Helmet** - Security Headers
- ✅ **SQL Injection** - Verhindert durch Prisma ORM
- ✅ **XSS Protection** - Content Security Policy
- ✅ **Audit Logging** - Alle wichtigen Aktionen werden geloggt

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register       # Registrierung
POST   /api/auth/login          # Login
POST   /api/auth/refresh        # Token erneuern
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Profil abrufen
```

### Vouchers
```
GET    /api/vouchers            # Meine Gutscheine
POST   /api/vouchers            # Gutschein generieren
GET    /api/vouchers/:id        # Gutschein Details
POST   /api/vouchers/:id/redeem # Gutschein einlösen
POST   /api/vouchers/validate   # QR-Code validieren
```

### Partners
```
GET    /api/partners            # Alle Partner (public)
GET    /api/partners/:id        # Partner Details
GET    /api/partners/:id/stats  # Partner Statistiken (admin)
```

Vollständige API-Dokumentation: [backend/README.md](backend/README.md)

## 💰 Kosten-Vergleich

### Self-Hosted
| Service | Anbieter | Preis/Monat |
|---------|----------|-------------|
| VPS (4GB RAM, 2 CPU) | Hetzner | 4,51€ |
| VPS (8GB RAM, 2 CPU) | Netcup | 6,00€ |
| VPS (4GB RAM, 2 CPU) | DigitalOcean | $12 (~11€) |

**Total: 5-12€/Monat** (unbegrenzte Nutzer!)

### Cloud (Supabase)
| Tier | Preis/Monat | Limits |
|------|-------------|--------|
| Free | $0 | 500 MB DB, 2 GB Bandwidth |
| Pro | $25 | 8 GB DB, 50 GB Bandwidth |
| Team | $599 | 32 GB DB, 250 GB Bandwidth |

**Empfehlung:** Self-Hosted ab 100+ Nutzer deutlich günstiger!

## 🏆 Production Ready Features

- ✅ **Multi-stage Docker Builds** - Optimierte Container-Größe
- ✅ **Health Checks** - Für alle Services
- ✅ **Graceful Shutdown** - Sauberes Beenden
- ✅ **Structured Logging** - Winston mit Log Rotation
- ✅ **Database Migrations** - Prisma Migrations
- ✅ **Automated Backups** - Täglich mit Rotation
- ✅ **Monitoring Ready** - Prometheus + Grafana
- ✅ **HTTPS Support** - Via Nginx Reverse Proxy
- ✅ **Environment Variables** - Secure Configuration
- ✅ **Non-Root User** - Security Best Practice

## 📈 Roadmap

### ✅ Fertig (v1.0)
- [x] Backend REST API
- [x] JWT Authentication
- [x] Docker Setup
- [x] Self-Hosted Supabase
- [x] Automated Backups
- [x] Admin Dashboard
- [x] QR-Code Scanner
- [x] Partner Map

### 🚧 In Arbeit (v1.1)
- [ ] Email Service (SendGrid)
- [ ] PDF Export für Gutscheine
- [ ] Erweiterte Analytics
- [ ] Mobile App (React Native)

### 📅 Geplant (v2.0)
- [ ] Push Notifications
- [ ] Payment Integration
- [ ] Multi-Tenant Support
- [ ] White-Label Solution

## 🤝 Beitragen

Beiträge sind willkommen! Bitte:

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing`)
3. Changes committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing`)
5. Pull Request öffnen

## 🐛 Bug Reports

Probleme? Öffne ein Issue:
https://github.com/BabsyIT/Gutscheine/issues

Bitte inkludiere:
- Beschreibung des Problems
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- System-Info (OS, Docker Version, etc.)

## 📄 Lizenz

© 2025 Babsy. All rights reserved.

## 🙏 Credits

- **Leaflet.js** - Interactive maps
- **Prisma** - Database ORM
- **Express** - Web framework
- **Supabase** - PostgreSQL images
- **Font Awesome** - Icons
- **Docker** - Containerization

## 📞 Support

- **Email**: support@babsy.ch
- **GitHub**: https://github.com/BabsyIT/Gutscheine
- **Dokumentation**: Siehe `/docs` Ordner

---

**Made with ❤️ in Switzerland**

🚀 **Ready to start?** → [QUICKSTART.md](QUICKSTART.md) oder [SELF-HOSTED-SUPABASE.md](SELF-HOSTED-SUPABASE.md)
