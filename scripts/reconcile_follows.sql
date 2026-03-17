CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reconcile Follow relationships
INSERT INTO public."Follow" (id, "followerId", "followingId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    fu.new_id,
    fu2.new_id,
    COALESCE(f.created_at, NOW())
FROM legacy.followers f
JOIN legacy.id_mapping fu ON f.user_id = fu.legacy_id
JOIN legacy.id_mapping fu2 ON f.followed_id = fu2.legacy_id
ON CONFLICT ("followerId", "followingId") DO NOTHING;
