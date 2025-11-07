#!/bin/bash

# PostgreSQL Initialization Script
# This script runs automatically when the database is first created

set -e

echo "🚀 Initializing Babsy Voucher Database..."

# Enable required extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Enable pgcrypto for better password hashing
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Enable pg_stat_statements for performance monitoring
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

    -- Enable PostGIS (if you need geolocation features)
    -- CREATE EXTENSION IF NOT EXISTS "postgis";

    -- Create database roles
    CREATE ROLE anon NOLOGIN NOINHERIT;
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;

    -- Grant permissions
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

    -- Alter default privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    \$\$ LANGUAGE plpgsql;

    -- Log initialization
    SELECT 'Database initialized successfully!' AS status;
EOSQL

echo "✅ Database initialization complete!"
