CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a mapping table to keep track of legacy and new IDs
CREATE TABLE IF NOT EXISTS legacy.id_mapping (
    legacy_id bigint PRIMARY KEY,
    new_id text NOT NULL
);

-- Truncate mapping
TRUNCATE TABLE legacy.id_mapping;

-- Populate mapping table for users who have at least an email, handling duplicates by picking the latest record
INSERT INTO legacy.id_mapping (legacy_id, new_id)
SELECT DISTINCT ON (email) id, gen_random_uuid()::text 
FROM legacy.users 
WHERE email IS NOT NULL AND email != ''
ORDER BY email, id DESC;

-- Clean target tables
TRUNCATE TABLE public."User" CASCADE;
TRUNCATE TABLE public."Profile" CASCADE;

-- Reconcile Users
INSERT INTO public."User" (id, email, "passwordHash", "createdAt", "updatedAt", role, status)
SELECT 
    m.new_id, 
    u.email, 
    COALESCE(u.password, 'SOCIAL_LOGIN_PLACEHOLDER'),
    COALESCE(u.created_at, NOW()), 
    COALESCE(u.updated_at, NOW()), 
    'USER', 
    'ACTIVE'
FROM legacy.users u
JOIN legacy.id_mapping m ON u.id = m.legacy_id;

-- Reconcile Profiles
INSERT INTO public."Profile" (id, "userId", name, handle, avatar, "createdAt", "updatedAt", verified)
SELECT 
    gen_random_uuid()::text,
    m.new_id,
    COALESCE(NULLIF(TRIM(u.firstname || ' ' || u.lastname), ''), u.username, 'User'),
    COALESCE(u.username, 'user_' || u.id),
    u.profile_image,
    COALESCE(u.created_at, NOW()),
    COALESCE(u.updated_at, NOW()),
    CASE WHEN u.account_verified::text = 'verified' THEN true ELSE false END
FROM legacy.users u
JOIN legacy.id_mapping m ON u.id = m.legacy_id;
