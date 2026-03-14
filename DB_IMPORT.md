# Importing the MySQL Database Dump

Your dump file `db_werfiedb_20260227_023004_mysql_data (1).sql.gz` is a **MySQL** dump.  
This project currently uses **PostgreSQL** for its services.

---

## Option A: Import into MySQL (Create Tables + Data)

Use this if you want to run the dump as-is and create all tables with data in MySQL.

### 1. Start MySQL (Docker)

```powershell
docker compose -f docker-compose.yml -f docker-compose.mysql-import.yml up -d mysql
```

Wait ~30 seconds for MySQL to be ready.

### 2. Run the import script

```powershell
.\scripts\import-mysql-dump.ps1
```

Or with custom path:

```powershell
.\scripts\import-mysql-dump.ps1 -DumpPath "db_werfiedb_20260227_023004_mysql_data (1).sql.gz"
```

### 3. Manual import (if you have `mysql` and `gzip` in PATH)

```bash
gunzip -c "db_werfiedb_20260227_023004_mysql_data (1).sql.gz" | mysql -h localhost -P 3306 -u root -proot werfiedb
```

**Default credentials:**
- Host: `localhost`
- Port: `3306`
- User: `root` / Password: `root`
- Database: `werfiedb`

---

## Option B: Use PostgreSQL (Current Project Setup)

The app uses **PostgreSQL** (`postgresql://...@localhost:5432/xclone_db`).  
The MySQL dump cannot be imported directly into PostgreSQL.

To create tables in PostgreSQL, use Prisma:

```powershell
cd apps/services/user
npx prisma db push
# or
npx prisma migrate deploy
```

This creates tables based on the Prisma schema, but **does not** load the data from the MySQL dump.

To migrate **data** from MySQL → PostgreSQL, use [pgloader](https://pgloader.io/):

1. Import the dump into MySQL (Option A).
2. Install pgloader (e.g. via Chocolatey: `choco install pgloader`).
3. Run pgloader with a config file pointing to MySQL source and PostgreSQL target.

---

## Summary

| Goal | Action |
|------|--------|
| Create tables + load data from the dump | Use **Option A** (MySQL) |
| Create tables for the current app (PostgreSQL) | Use Prisma: `npx prisma db push` in each service |
| Move dump data into PostgreSQL | Import into MySQL first, then migrate with pgloader |
