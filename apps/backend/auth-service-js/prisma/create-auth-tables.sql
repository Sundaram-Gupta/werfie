-- Create minimal auth tables for login
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "role" TEXT NOT NULL DEFAULT 'USER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "preferredLanguage" TEXT NOT NULL DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS "Profile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT,
  "handle" TEXT UNIQUE,
  "bio" TEXT,
  "avatar" TEXT,
  "banner" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "location" TEXT,
  "website" TEXT,
  "birthdate" TIMESTAMPTZ,
  "gender" TEXT
);

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
