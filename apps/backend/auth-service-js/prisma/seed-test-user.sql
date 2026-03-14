INSERT INTO "User" (id, email, "passwordHash")
VALUES (
  gen_random_uuid(),
  'test@gmail.com',
  '$2b$10$YT0uv3XTL.JKkQvcvoQX4OR/TPEm5t7DjE6fTr8.QiMUUA/pvwgXu'
)
ON CONFLICT (email) DO NOTHING;
