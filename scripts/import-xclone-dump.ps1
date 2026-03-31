<#
.SYNOPSIS
  Import xclone_db_dump.sql into the Docker Postgres used by this project (xclone-postgres).

.DESCRIPTION
  - Expects DATABASE_URL-style credentials: user xclone, DB xclone_db, port 5433 on host (container name: xclone-postgres).
  - pg_dump 18 emits a \restrict line that PostgreSQL 15 psql does not understand; this script removes line 5 (the restrict line) while streaming.
  - Drops and recreates database xclone_db (full replace). BACK UP FIRST if you need the current data.

.PARAMETER DumpPath
  Path to xclone_db_dump.sql (default: repo root).

.PARAMETER SkipRecreate
  If set, does not DROP/CREATE database (import may fail if objects already exist).

.EXAMPLE
  .\scripts\import-xclone-dump.ps1
#>

param(
    [string] $DumpPath = (Join-Path $PSScriptRoot "..\xclone_db_dump.sql"),
    [switch] $SkipRecreate
)

$ErrorActionPreference = "Stop"
$DumpPath = Resolve-Path $DumpPath

Write-Host "Dump file: $DumpPath"
if (-not (Test-Path $DumpPath)) { throw "Dump file not found: $DumpPath" }

docker ps --format "{{.Names}}" | Select-String -Pattern "^xclone-postgres$" -Quiet | Out-Null
if (-not $?) { docker ps -a --format "{{.Names}}" | Select-String "xclone-postgres" }
$running = docker ps --format "{{.Names}}" | Where-Object { $_ -eq "xclone-postgres" }
if (-not $running) {
    throw "Container xclone-postgres is not running. Start your stack (e.g. docker compose up -d) first."
}

if (-not $SkipRecreate) {
    Write-Host "Terminating connections and recreating database xclone_db..."
    docker exec xclone-postgres psql -U xclone -d postgres -v ON_ERROR_STOP=1 -c @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'xclone_db' AND pid <> pg_backend_pid();
"@
    # WITH (FORCE) terminates backends (PG13+); needed if API/workers still hold connections.
    docker exec xclone-postgres psql -U xclone -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS xclone_db WITH (FORCE);"
    docker exec xclone-postgres psql -U xclone -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE xclone_db OWNER xclone;"
}

Write-Host "Copying dump into container (large file, may take several minutes)..."
docker cp "$DumpPath" "xclone-postgres:/tmp/xclone_db_dump.sql"

Write-Host "Importing (this can take a long time for multi-GB dumps)..."
# Line 5: pg_dump 18 \restrict — not understood by psql 15.
# SET transaction_timeout: PostgreSQL 17+ only; container is PG 15.
# Strip pg18 \\restrict line (line 5) and PG17+ SET transaction_timeout. Trailing \\unrestrict may print a harmless psql notice.
docker exec xclone-postgres sh -c "sed -e '5d' -e '/^SET transaction_timeout/d' /tmp/xclone_db_dump.sql | psql -U xclone -d xclone_db -v ON_ERROR_STOP=1"

Write-Host "Removing temporary file in container..."
docker exec xclone-postgres rm -f /tmp/xclone_db_dump.sql

Write-Host "Done. Run prisma migrate if needed: cd apps/services/user && npx prisma migrate deploy"
exit 0
