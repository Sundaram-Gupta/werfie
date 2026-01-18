#!/bin/bash

# PostgreSQL Migration Script for X-Clone Backend
# This script helps migrate from SQLite to PostgreSQL

set -e

echo "🔄 X-Clone PostgreSQL Migration Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env from template..."
    cp .env.postgresql.template .env
    echo -e "${YELLOW}⚠️  Please update DATABASE_URL in .env with your PostgreSQL connection string${NC}"
    echo ""
    echo "Options:"
    echo "1. Neon (Free): https://neon.tech"
    echo "2. Supabase (Free): https://supabase.com"
    echo "3. Railway (Free): https://railway.app"
    echo "4. Local Docker: docker-compose up -d"
    echo ""
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env; then
    echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
    exit 1
fi

# Check if it's still SQLite
if grep -q "file:./dev.db" .env; then
    echo -e "${YELLOW}⚠️  Still using SQLite database${NC}"
    echo "Please update DATABASE_URL in .env to PostgreSQL connection string"
    exit 1
fi

echo -e "${GREEN}✅ .env file configured${NC}"
echo ""

# Backup existing migrations
if [ -d "prisma/migrations" ]; then
    echo "📦 Backing up existing migrations..."
    mv prisma/migrations prisma/migrations.sqlite.backup
    echo -e "${GREEN}✅ Migrations backed up${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Create migration
echo ""
echo "🗄️  Creating PostgreSQL migration..."
npx prisma migrate dev --name init_postgresql

# Check migration status
echo ""
echo "📊 Checking migration status..."
npx prisma migrate status

echo ""
echo -e "${GREEN}✅ PostgreSQL migration completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test APIs: cd .. && ./test-all-apis.sh"
echo ""
