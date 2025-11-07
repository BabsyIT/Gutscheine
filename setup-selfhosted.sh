#!/bin/bash

# Babsy Voucher System - Self-Hosted Setup Script
# This script helps you quickly set up the self-hosted version

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║   Babsy Voucher System - Self-Hosted Setup        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"
echo -e "${GREEN}✅ Docker Compose: $(docker-compose --version)${NC}"
echo ""

# Create directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p supabase/backups
mkdir -p backend/logs
chmod +x supabase/init/01-init.sh 2>/dev/null || true
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
    else
        cp .env.selfhosted.example .env
        echo -e "${GREEN}✅ .env file created from template${NC}"
    fi
else
    cp .env.selfhosted.example .env
    echo -e "${GREEN}✅ .env file created from template${NC}"
fi
echo ""

# Generate secrets
echo -e "${BLUE}🔐 Generating secure secrets...${NC}"

if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)

    # Replace in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=\"${JWT_SECRET}\"|g" .env
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"${JWT_REFRESH_SECRET}\"|g" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"${JWT_SECRET}\"|g" .env
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"${JWT_REFRESH_SECRET}\"|g" .env
    fi

    echo -e "${GREEN}✅ JWT secrets generated and saved to .env${NC}"
else
    echo -e "${YELLOW}⚠️  OpenSSL not found. Please generate JWT secrets manually:${NC}"
    echo "   openssl rand -base64 32"
fi
echo ""

# Prompt for passwords
echo -e "${BLUE}🔒 Please set secure passwords:${NC}"
echo ""

read -sp "PostgreSQL Password: " POSTGRES_PASSWORD
echo ""
read -sp "pgAdmin Password: " PGADMIN_PASSWORD
echo ""
read -sp "Redis Password: " REDIS_PASSWORD
echo ""
echo ""

# Update .env with passwords
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|g" .env
    sed -i '' "s|PGADMIN_PASSWORD=.*|PGADMIN_PASSWORD=${PGADMIN_PASSWORD}|g" .env
    sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|g" .env
else
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|g" .env
    sed -i "s|PGADMIN_PASSWORD=.*|PGADMIN_PASSWORD=${PGADMIN_PASSWORD}|g" .env
    sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|g" .env
fi

echo -e "${GREEN}✅ Passwords saved to .env${NC}"
echo ""

# Secure .env file
chmod 600 .env
echo -e "${GREEN}✅ .env file permissions set to 600${NC}"
echo ""

# Ask to start services
echo -e "${BLUE}🚀 Ready to start services!${NC}"
read -p "Do you want to start all services now? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${BLUE}Starting services...${NC}"
    docker-compose -f docker-compose.selfhosted.yml up -d

    echo ""
    echo -e "${YELLOW}⏳ Waiting for services to be ready (30 seconds)...${NC}"
    sleep 30

    # Check health
    echo ""
    echo -e "${BLUE}🏥 Checking service health...${NC}"

    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: http://localhost:3000${NC}"
    else
        echo -e "${RED}❌ Backend not responding${NC}"
    fi

    if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: http://localhost:8080${NC}"
    else
        echo -e "${RED}❌ Frontend not responding${NC}"
    fi

    if docker-compose -f docker-compose.selfhosted.yml exec -T postgres pg_isready > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL: ready${NC}"
    else
        echo -e "${RED}❌ PostgreSQL not ready${NC}"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║              ✅ Setup Complete!                     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Initialize database:"
echo "   ${BLUE}cd backend && npx prisma db push${NC}"
echo ""
echo "2. Migrate data (optional):"
echo "   ${BLUE}cd backend && node scripts/migrate-json-to-db.js${NC}"
echo ""
echo "3. Access the services:"
echo "   - Frontend:  ${BLUE}http://localhost:8080${NC}"
echo "   - Backend:   ${BLUE}http://localhost:3000${NC}"
echo "   - pgAdmin:   ${BLUE}http://localhost:5050${NC}"
echo "   - PostgREST: ${BLUE}http://localhost:3001${NC}"
echo ""
echo "4. View logs:"
echo "   ${BLUE}make logs${NC}"
echo ""
echo "5. See all commands:"
echo "   ${BLUE}make help${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important: Change default application passwords after first login!${NC}"
echo ""
echo "📚 Documentation:"
echo "   - ${BLUE}SELF-HOSTED-SUPABASE.md${NC} - Complete guide"
echo "   - ${BLUE}QUICKSTART.md${NC} - Quick start"
echo "   - ${BLUE}Makefile${NC} - All available commands"
echo ""
echo "🎉 Happy coding!"
echo ""
