# Docker Deployment Guide - Babsy Voucher System

Complete guide for deploying the Babsy Voucher System using Docker containers with Supabase as the database.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Database Migration](#database-migration)
6. [Monitoring & Logs](#monitoring--logs)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Node.js** >= 18 (for local development)
- **Git**

### Install Docker

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install --cask docker
```

**Windows:**
Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `babsy-vouchers`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
4. Click **"Create Project"**

### 2. Get Database Connection String

1. In Supabase Dashboard → **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Enable Required Extensions

Run in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for better password hashing (optional)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.docker.example .env

# Edit .env and fill in your values
nano .env
```

**Required `.env` values:**

```bash
# Supabase Connection (from step above)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT Secrets (GENERATE NEW ONES!)
JWT_SECRET="use-openssl-rand-base64-32-to-generate-this"
JWT_REFRESH_SECRET="use-openssl-rand-base64-32-to-generate-this"

# CORS
ALLOWED_ORIGINS="http://localhost:8080"

# Logging
LOG_LEVEL="info"
```

**Generate secure JWT secrets:**

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

### 3. Initialize Database

```bash
cd backend

# Install dependencies
npm install

# Push Prisma schema to Supabase
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**Verify in Supabase:**
Go to **Table Editor** and you should see tables: `users`, `partners`, `vouchers`, `sessions`, `audit_log`

### 4. Migrate Existing Data (Optional)

If you have existing JSON data:

```bash
# From backend directory
node scripts/migrate-json-to-db.js
```

This will migrate:
- Partners from `data/partners.json`
- Members from `data/mitglieder-auth.json`
- Employees from `data/users.json`
- Vouchers from `data/vouchers.json`

### 5. Start Docker Containers

```bash
# From project root
docker-compose up -d
```

**Services started:**
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:8080
- **Redis**: localhost:6379

### 6. Verify Deployment

```bash
# Check containers
docker-compose ps

# Check backend health
curl http://localhost:3000/health

# Check frontend
curl http://localhost:8080/health

# View logs
docker-compose logs -f backend
```

---

## Production Deployment

### Option A: Docker Compose on VPS

**Requirements:**
- VPS (DigitalOcean, Hetzner, AWS EC2, etc.)
- Ubuntu 22.04 or similar
- 2 GB RAM minimum
- 20 GB storage

#### 1. Setup VPS

```bash
# SSH into VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y
```

#### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/BabsyIT/Gutscheine.git
cd Gutscheine

# Setup environment
cp .env.docker.example .env
nano .env  # Fill in production values

# Update ALLOWED_ORIGINS
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# Start containers
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### 3. Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
nano /etc/nginx/sites-available/babsy
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/babsy /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Setup SSL
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
```

#### 4. Setup Auto-Start

```bash
# Enable Docker to start on boot
systemctl enable docker

# Docker Compose will auto-restart containers
```

### Option B: Deploy to Cloud Platform

#### Railway.app

1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Connect repository
4. Add **Supabase** database (or use existing)
5. Set environment variables
6. Deploy!

**Costs**: ~$5-20/month

#### Render.com

1. Go to [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repo
4. **Docker** build
5. Set environment variables
6. Deploy!

**Costs**: Free tier available, then $7+/month

#### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch backend
cd backend
fly launch

# Launch frontend
cd ../frontend-docker
fly launch
```

**Costs**: Free tier generous, then ~$3+/month

---

## Database Migration

### Initial Setup

```bash
# From backend directory
npx prisma db push
npx prisma generate
```

### Migrate JSON Data

```bash
# Run migration script
node scripts/migrate-json-to-db.js
```

### Create Admin User

```bash
# Open Prisma Studio
npx prisma studio

# Or use SQL
```

In Supabase SQL Editor:

```sql
INSERT INTO users (id, username, email, password_hash, user_type, name, is_active)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@babsy.ch',
  '$2b$12$examplehash',  -- Generate with bcrypt
  'employee',
  'Admin User',
  true
);
```

**Generate password hash:**

```bash
# In Node.js REPL
node
> const bcrypt = require('bcrypt')
> bcrypt.hashSync('YourSecurePassword123!', 12)
```

### Backup Database

```bash
# Using Supabase CLI
supabase db dump > backup.sql

# Or download from Supabase Dashboard
# Settings → Database → Download backup
```

---

## Monitoring & Logs

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Container Stats

```bash
# Resource usage
docker stats

# Specific container
docker stats babsy-backend
```

### Health Checks

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost:8080/health

# Full check
docker-compose ps
```

### Application Logs

Backend logs are stored in `backend/logs/`:

```bash
# View error logs
tail -f backend/logs/error.log

# View combined logs
tail -f backend/logs/combined.log
```

### Supabase Monitoring

1. Go to Supabase Dashboard
2. **Database** → **Logs**
3. View:
   - Query performance
   - Slow queries
   - Database size
   - Connection stats

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - DATABASE_URL not set
# - Port already in use
# - Insufficient memory
```

**Solution:**

```bash
# Stop all containers
docker-compose down

# Check .env file
cat .env

# Restart with fresh build
docker-compose up --build -d
```

### Database Connection Issues

**Error:** `Connection refused`

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Should be:
# postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Test connection
docker-compose exec backend node -e "require('./src/config/database').prisma.\$connect().then(() => console.log('OK'))"
```

### Frontend Not Loading

```bash
# Check if backend is accessible
curl http://localhost:3000/health

# Check nginx logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up --build frontend
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :8080

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Restart containers
docker-compose restart

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory
```

### Prisma Issues

```bash
# Regenerate client
cd backend
npx prisma generate

# Reset database (WARNING: Deletes all data!)
npx prisma db push --force-reset

# View database in browser
npx prisma studio
```

---

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Check status
docker-compose ps
```

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database (use Supabase CLI or pg_dump)
supabase db dump > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 backups
ls -t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs rm -f

echo "Backup completed: backup_$DATE.sql"
```

**Schedule with cron:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

## Security Checklist

- [ ] Changed default JWT secrets
- [ ] Changed default database password
- [ ] Enabled HTTPS (SSL certificate)
- [ ] Configured firewall (UFW, iptables)
- [ ] Restricted database access (Supabase IP whitelist)
- [ ] Regular backups enabled
- [ ] Monitoring alerts configured
- [ ] Environment variables secured
- [ ] Default partner passwords changed
- [ ] Strong admin password set

---

## Performance Optimization

### Enable Caching

Update `docker-compose.yml` to use Redis:

```yaml
backend:
  environment:
    REDIS_URL: redis://redis:6379
```

### Database Indexing

```sql
-- Already included in Prisma schema
-- Verify in Supabase:
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public';
```

### CDN for Static Assets

Use Cloudflare or similar CDN for `images/` and `js/` folders.

---

## Support

**Issues?**
- 📖 [GitHub Issues](https://github.com/BabsyIT/Gutscheine/issues)
- 📧 Email: support@babsy.ch
- 💬 [Supabase Community](https://github.com/supabase/supabase/discussions)

**Documentation:**
- [Docker Docs](https://docs.docker.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)

---

**Last Updated**: 2025-01-XX
**Version**: 1.0
