# Babsy Voucher System - Makefile
# Quick commands for development and deployment

.PHONY: help setup start stop restart logs clean backup restore

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "╔════════════════════════════════════════════════╗"
	@echo "║   Babsy Voucher System - Available Commands   ║"
	@echo "╚════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
# Setup
# ============================================================================

setup: ## Initial setup (copy env files, generate secrets)
	@echo "🔧 Setting up Babsy Voucher System..."
	@if [ ! -f .env ]; then \
		cp .env.selfhosted.example .env; \
		echo "📝 Created .env file. Please edit it with your values!"; \
		echo ""; \
		echo "Generate JWT secrets with:"; \
		echo "  openssl rand -base64 32"; \
		echo ""; \
	else \
		echo "⚠️  .env already exists. Skipping..."; \
	fi
	@mkdir -p supabase/backups backend/logs
	@chmod +x supabase/init/01-init.sh
	@echo "✅ Setup complete!"

secrets: ## Generate new JWT secrets
	@echo "🔐 Generating JWT secrets..."
	@echo ""
	@echo "JWT_SECRET:"
	@openssl rand -base64 32
	@echo ""
	@echo "JWT_REFRESH_SECRET:"
	@openssl rand -base64 32
	@echo ""
	@echo "Copy these to your .env file!"

# ============================================================================
# Docker Operations
# ============================================================================

start: ## Start all services
	@echo "🚀 Starting Babsy Voucher System..."
	docker-compose -f docker-compose.selfhosted.yml up -d
	@echo "✅ All services started!"
	@echo ""
	@echo "📊 URLs:"
	@echo "  Frontend:  http://localhost:8080"
	@echo "  Backend:   http://localhost:3000"
	@echo "  pgAdmin:   http://localhost:5050"
	@echo "  PostgREST: http://localhost:3001"

stop: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose -f docker-compose.selfhosted.yml stop
	@echo "✅ All services stopped!"

restart: ## Restart all services
	@echo "🔄 Restarting all services..."
	docker-compose -f docker-compose.selfhosted.yml restart
	@echo "✅ All services restarted!"

down: ## Stop and remove all containers
	@echo "🗑️  Stopping and removing all containers..."
	docker-compose -f docker-compose.selfhosted.yml down
	@echo "✅ All containers removed!"

build: ## Rebuild all containers
	@echo "🔨 Building containers..."
	docker-compose -f docker-compose.selfhosted.yml build
	@echo "✅ Build complete!"

rebuild: ## Rebuild and start all services
	@echo "🔨 Rebuilding and starting..."
	docker-compose -f docker-compose.selfhosted.yml up -d --build
	@echo "✅ Rebuild complete!"

# ============================================================================
# Logs & Monitoring
# ============================================================================

logs: ## Show logs from all services
	docker-compose -f docker-compose.selfhosted.yml logs -f

logs-backend: ## Show backend logs only
	docker-compose -f docker-compose.selfhosted.yml logs -f backend

logs-postgres: ## Show PostgreSQL logs
	docker-compose -f docker-compose.selfhosted.yml logs -f postgres

logs-frontend: ## Show frontend logs
	docker-compose -f docker-compose.selfhosted.yml logs -f frontend

ps: ## Show running containers
	docker-compose -f docker-compose.selfhosted.yml ps

stats: ## Show container resource usage
	docker stats

health: ## Check health of all services
	@echo "🏥 Checking health..."
	@echo ""
	@echo "Backend:"
	@curl -s http://localhost:3000/health || echo "❌ Backend not responding"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:8080/health || echo "❌ Frontend not responding"
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose -f docker-compose.selfhosted.yml exec -T postgres pg_isready || echo "❌ PostgreSQL not ready"
	@echo ""

# ============================================================================
# Database Operations
# ============================================================================

db-init: ## Initialize database schema
	@echo "📊 Initializing database..."
	cd backend && npx prisma db push
	@echo "✅ Database initialized!"

db-migrate: ## Migrate JSON data to database
	@echo "📦 Migrating data..."
	cd backend && node scripts/migrate-json-to-db.js
	@echo "✅ Migration complete!"

db-studio: ## Open Prisma Studio
	cd backend && npx prisma studio

db-shell: ## Open PostgreSQL shell
	docker-compose -f docker-compose.selfhosted.yml exec postgres psql -U postgres -d babsy_vouchers

# ============================================================================
# Backup & Restore
# ============================================================================

backup: ## Create database backup
	@echo "💾 Creating backup..."
	@mkdir -p supabase/backups
	@docker-compose -f docker-compose.selfhosted.yml exec -T postgres pg_dump -U postgres -d babsy_vouchers > supabase/backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created: supabase/backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

restore: ## Restore from latest backup (use BACKUP_FILE=filename to specify)
	@echo "📥 Restoring from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then \
		LATEST=$$(ls -t supabase/backups/*.sql | head -1); \
		echo "Using latest backup: $$LATEST"; \
		docker-compose -f docker-compose.selfhosted.yml exec -T postgres psql -U postgres -d babsy_vouchers < $$LATEST; \
	else \
		echo "Using specified backup: $(BACKUP_FILE)"; \
		docker-compose -f docker-compose.selfhosted.yml exec -T postgres psql -U postgres -d babsy_vouchers < $(BACKUP_FILE); \
	fi
	@echo "✅ Restore complete!"

backup-list: ## List all backups
	@echo "📋 Available backups:"
	@ls -lh supabase/backups/*.sql 2>/dev/null || echo "No backups found"

# ============================================================================
# Monitoring (Optional)
# ============================================================================

monitoring: ## Start with monitoring (Prometheus + Grafana)
	@echo "📊 Starting with monitoring..."
	docker-compose -f docker-compose.selfhosted.yml --profile monitoring up -d
	@echo "✅ Monitoring started!"
	@echo ""
	@echo "📊 URLs:"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana:    http://localhost:3002"

# ============================================================================
# Maintenance
# ============================================================================

clean: ## Clean up unused Docker resources
	@echo "🧹 Cleaning up..."
	docker system prune -f
	@echo "✅ Cleanup complete!"

clean-all: ## Remove all containers, volumes, and data (DANGEROUS!)
	@echo "⚠️  WARNING: This will delete ALL data!"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.selfhosted.yml down -v; \
		rm -rf supabase/backups/* backend/logs/*; \
		echo "✅ Everything cleaned!"; \
	else \
		echo "Cancelled."; \
	fi

update: ## Pull latest changes and restart
	@echo "🔄 Updating..."
	git pull
	docker-compose -f docker-compose.selfhosted.yml up -d --build
	@echo "✅ Update complete!"

# ============================================================================
# Development
# ============================================================================

dev: ## Start in development mode with hot reload
	@echo "🔧 Starting in development mode..."
	docker-compose -f docker-compose.selfhosted.yml up

shell-backend: ## Open shell in backend container
	docker-compose -f docker-compose.selfhosted.yml exec backend sh

shell-postgres: ## Open shell in postgres container
	docker-compose -f docker-compose.selfhosted.yml exec postgres bash

# ============================================================================
# Testing
# ============================================================================

test: ## Run backend tests
	cd backend && npm test

test-api: ## Test API endpoints
	@echo "🧪 Testing API..."
	@echo ""
	@echo "Health Check:"
	@curl -s http://localhost:3000/health | jq . || echo "❌ Failed"
	@echo ""
	@echo "Partners List:"
	@curl -s http://localhost:3000/api/partners | jq 'length' || echo "❌ Failed"
	@echo ""

# ============================================================================
# Security
# ============================================================================

security-check: ## Check for security issues
	@echo "🔒 Security check..."
	@echo ""
	@echo "Checking .env file permissions..."
	@ls -l .env 2>/dev/null || echo "No .env file found"
	@echo ""
	@echo "Checking for exposed ports..."
	@docker-compose -f docker-compose.selfhosted.yml ps
	@echo ""
	@echo "Checking for default passwords in .env..."
	@grep -E "(POSTGRES_PASSWORD|JWT_SECRET|PGADMIN_PASSWORD).*=(ChangeThis|your-)" .env 2>/dev/null && echo "⚠️  WARNING: Default passwords detected!" || echo "✅ No default passwords found"
