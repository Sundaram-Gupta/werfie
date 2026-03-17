CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Mapping for posts
CREATE TABLE IF NOT EXISTS legacy.post_id_mapping (
    legacy_id bigint PRIMARY KEY,
    new_id text NOT NULL
);

TRUNCATE TABLE legacy.post_id_mapping;

INSERT INTO legacy.post_id_mapping (legacy_id, new_id)
SELECT id, gen_random_uuid()::text FROM legacy.posts;

-- Reconcile Posts
TRUNCATE TABLE public."Post" CASCADE;

INSERT INTO public."Post" (id, "userId", content, "createdAt", "updatedAt")
SELECT 
    m.new_id, 
    um.new_id, 
    COALESCE(u.body, ''),
    COALESCE(u.created_at, NOW()), 
    COALESCE(u.updated_at, NOW())
FROM legacy.posts u
JOIN legacy.post_id_mapping m ON u.id = m.legacy_id
JOIN legacy.id_mapping um ON u.user_id = um.legacy_id;

-- Reconcile PostMedia (post images) using user-service PostMedia schema
TRUNCATE TABLE public."PostMedia" CASCADE;

INSERT INTO public."PostMedia" (id, "postId", "mediaType", "mediaUrl", "thumbnailUrl", width, height, duration, size, "createdAt")
SELECT 
    gen_random_uuid()::text,
    pm.new_id,
    'image',
    f.file_path,
    f.thumbnail_path,
    0,
    0,
    NULL,
    COALESCE(f.size, 0)::int,
    COALESCE(f.created_at, NOW())
FROM legacy.post_files f
JOIN legacy.post_id_mapping pm ON f.post_id = pm.legacy_id
JOIN legacy.posts p ON f.post_id = p.id
JOIN legacy.id_mapping um ON p.user_id = um.legacy_id;
