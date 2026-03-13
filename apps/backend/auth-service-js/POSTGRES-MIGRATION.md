# PostgreSQL Migration Guide

## Quick Setup (Choose One Option)

### Option 1: Neon (Recommended - Fastest)
1. Go to https://neon.tech
2. Sign up (free)
3. Create new project "xclone"
4. Copy connection string
5. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```

### Option 2: Supabase
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use "Connection pooling" mode)
5. Update `.env`

### Option 3: Railway
1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Copy connection string
5. Update `.env`

### Option 4: Local Docker
1. Install Docker Desktop
2. Run: `docker-compose up -d`
3. Use: `DATABASE_URL="postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db?schema=public"`

## Migration Steps

```bash
cd /Users/ashish/Aspire/X/X-Backend/auth-service-js

# 1. Update .env with PostgreSQL connection string
nano .env  # or use your editor

# 2. Run migration script
./migrate-to-postgres.sh

# 3. Restart server
# Stop current server (Ctrl+C in terminal)
npm run dev

# 4. Test APIs
cd ..
./test-all-apis.sh
```

## What Changed

- ✅ Prisma schema updated to PostgreSQL
- ✅ Docker Compose file created
- ✅ Migration script created
- ⏳ Need to update .env with PostgreSQL URL
- ⏳ Need to run migration

## Files Modified

- `prisma/schema.prisma` - Changed provider to postgresql
- `docker-compose.yml` - Added PostgreSQL container config
- `migrate-to-postgres.sh` - Migration automation script
- `.env.postgresql.template` - PostgreSQL connection examples
